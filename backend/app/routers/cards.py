from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, update
from sqlalchemy.orm import Session

from app.core.deps import ensure_role, get_current_user
from app.database import get_db
from app.models import BoardColumn, BoardRole, Card, User
from app.schemas.card import CardCreate, CardOut, CardUpdate

router = APIRouter(tags=["cards"])


def _get_column_or_404(column_id: int, db: Session) -> BoardColumn:
    column = db.get(BoardColumn, column_id)
    if column is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Колонка не найдена")
    return column


def _get_card_or_404(card_id: int, db: Session) -> Card:
    card = db.get(Card, card_id)
    if card is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Карточка не найдена")
    return card


@router.get("/columns/{column_id}/cards", response_model=list[CardOut])
def list_cards(
    column_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    column = _get_column_or_404(column_id, db)
    ensure_role(db, current_user.id, column.board_id, BoardRole.reader)

    return db.query(Card).filter(Card.column_id == column_id).order_by(Card.position).all()


@router.post("/columns/{column_id}/cards", response_model=CardOut, status_code=status.HTTP_201_CREATED)
def create_card(
    column_id: int,
    payload: CardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    column = _get_column_or_404(column_id, db)
    ensure_role(db, current_user.id, column.board_id, BoardRole.writer)

    if payload.assignee_id is not None:
        ensure_role(db, payload.assignee_id, column.board_id, BoardRole.reader)  # исполнитель должен быть участником доски

    position = payload.position
    if position is None:
        max_position = db.query(func.max(Card.position)).filter(Card.column_id == column_id).scalar()
        position = (max_position or 0) + 1

    card = Card(
        column_id=column_id,
        title=payload.title,
        description=payload.description,
        position=position,
        assignee_id=payload.assignee_id,
        due_date=payload.due_date,
        created_by=current_user.id,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.get("/cards/{card_id}", response_model=CardOut)
def get_card(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = _get_card_or_404(card_id, db)
    ensure_role(db, current_user.id, card.column.board_id, BoardRole.reader)
    return card


@router.patch("/cards/{card_id}", response_model=CardOut)
def update_card(
    card_id: int,
    payload: CardUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Редактирование полей карточки И перемещение между колонками (drag&drop) - одна ручка.

    Защита от коллизий: клиент обязан прислать version, которую он видел последней.
    UPDATE выполняется атомарно с условием version = <присланная версия> и одновременно
    увеличивает version на 1. Если за это время карточку успел изменить кто-то другой,
    WHERE не совпадёт ни с одной строкой -> возвращаем 409, а не тихо перезаписываем чужие правки.
    """
    card = _get_card_or_404(card_id, db)
    board_id = card.column.board_id
    ensure_role(db, current_user.id, board_id, BoardRole.writer)

    target_column_id = card.column_id
    if payload.column_id is not None and payload.column_id != card.column_id:
        target_column = _get_column_or_404(payload.column_id, db)
        if target_column.board_id != board_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Нельзя переместить карточку в колонку другой доски",
            )
        target_column_id = target_column.id

    if payload.assignee_id is not None:
        ensure_role(db, payload.assignee_id, board_id, BoardRole.reader)

    update_values = {"column_id": target_column_id}
    if payload.title is not None:
        update_values["title"] = payload.title
    if payload.description is not None:
        update_values["description"] = payload.description
    if payload.position is not None:
        update_values["position"] = payload.position
    if payload.assignee_id is not None:
        update_values["assignee_id"] = payload.assignee_id
    if payload.due_date is not None:
        update_values["due_date"] = payload.due_date

    stmt = (
        update(Card)
        .where(Card.id == card_id, Card.version == payload.version)
        .values(**update_values, version=Card.version + 1)
    )
    result = db.execute(stmt)

    if result.rowcount == 0:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Карточка уже была изменена другим пользователем. Обновите данные и попробуйте снова.",
        )

    db.commit()
    db.refresh(card)
    return card


@router.delete("/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = _get_card_or_404(card_id, db)
    ensure_role(db, current_user.id, card.column.board_id, BoardRole.writer)

    db.delete(card)
    db.commit()

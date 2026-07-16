from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import ensure_role, get_current_user
from app.database import get_db
from app.models import Board, BoardColumn, BoardMember, BoardRole, User
from app.routers.boards import require_board_role
from app.schemas.column import ColumnCreate, ColumnOut, ColumnUpdate

router = APIRouter(tags=["columns"])


def _get_column_or_404(column_id: int, db: Session) -> BoardColumn:
    column = db.get(BoardColumn, column_id)
    if column is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Колонка не найдена")
    return column


@router.get("/boards/{board_id}/columns", response_model=list[ColumnOut])
def list_columns(
    board_and_membership: tuple[Board, BoardMember] = Depends(require_board_role(BoardRole.reader)),
    db: Session = Depends(get_db),
):
    board, _ = board_and_membership
    return (
        db.query(BoardColumn)
        .filter(BoardColumn.board_id == board.id)
        .order_by(BoardColumn.position)
        .all()
    )


@router.post("/boards/{board_id}/columns", response_model=ColumnOut, status_code=status.HTTP_201_CREATED)
def create_column(
    payload: ColumnCreate,
    board_and_membership: tuple[Board, BoardMember] = Depends(require_board_role(BoardRole.writer)),
    db: Session = Depends(get_db),
):
    board, _ = board_and_membership

    position = payload.position
    if position is None:
        max_position = (
            db.query(func.max(BoardColumn.position)).filter(BoardColumn.board_id == board.id).scalar()
        )
        position = (max_position or 0) + 1

    column = BoardColumn(board_id=board.id, title=payload.title, position=position)
    db.add(column)
    db.commit()
    db.refresh(column)
    return column


@router.patch("/columns/{column_id}", response_model=ColumnOut)
def update_column(
    column_id: int,
    payload: ColumnUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    column = _get_column_or_404(column_id, db)
    ensure_role(db, current_user.id, column.board_id, BoardRole.writer)

    if payload.title is not None:
        column.title = payload.title
    if payload.position is not None:
        column.position = payload.position

    db.commit()
    db.refresh(column)
    return column


@router.delete("/columns/{column_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_column(
    column_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    column = _get_column_or_404(column_id, db)
    ensure_role(db, current_user.id, column.board_id, BoardRole.writer)

    db.delete(column)  # каскадно удалит карточки колонки
    db.commit()

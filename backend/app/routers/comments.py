from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import ensure_role, get_current_user
from app.database import get_db
from app.models import BoardRole, Card, Comment, User
from app.schemas.comment import CommentCreate, CommentOut

router = APIRouter(tags=["comments"])


def _get_card_or_404(card_id: int, db: Session) -> Card:
    card = db.get(Card, card_id)
    if card is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Карточка не найдена")
    return card


@router.get("/cards/{card_id}/comments", response_model=list[CommentOut])
def list_comments(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = _get_card_or_404(card_id, db)
    ensure_role(db, current_user.id, card.column.board_id, BoardRole.reader)

    return db.query(Comment).filter(Comment.card_id == card_id).order_by(Comment.created_at).all()


@router.post("/cards/{card_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(
    card_id: int,
    payload: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = _get_card_or_404(card_id, db)
    ensure_role(db, current_user.id, card.column.board_id, BoardRole.writer)

    comment = Comment(card_id=card_id, user_id=current_user.id, text=payload.text)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    comment = db.get(Comment, comment_id)
    if comment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Комментарий не найден")

    board_id = comment.card.column.board_id
    membership = ensure_role(db, current_user.id, board_id, BoardRole.reader)

    # удалить может либо автор комментария, либо владелец доски
    if comment.user_id != current_user.id and membership.role != BoardRole.owner:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Можно удалять только свои комментарии")

    db.delete(comment)
    db.commit()

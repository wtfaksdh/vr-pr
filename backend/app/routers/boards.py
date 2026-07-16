from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_board_or_404, get_current_user, get_membership, require_board_role
from app.database import get_db
from app.models import Board, BoardMember, BoardRole, User
from app.schemas.board import (
    BoardCreate,
    BoardMemberAdd,
    BoardMemberOut,
    BoardMemberUpdate,
    BoardOut,
    BoardUpdate,
)

router = APIRouter(tags=["boards"])


@router.get("/boards", response_model=list[BoardOut])
def list_my_boards(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Список досок, в которых текущий пользователь состоит участником (любая роль)."""
    memberships = db.query(BoardMember).filter(BoardMember.user_id == current_user.id).all()

    result = []
    for m in memberships:
        board_out = BoardOut.model_validate(m.board)
        board_out.my_role = m.role
        result.append(board_out)
    return result


@router.post("/boards", response_model=BoardOut, status_code=status.HTTP_201_CREATED)
def create_board(
    payload: BoardCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    board = Board(title=payload.title, description=payload.description, owner_id=current_user.id)
    db.add(board)
    db.flush()  # получаем board.id до коммита

    # создатель доски автоматически становится owner
    membership = BoardMember(board_id=board.id, user_id=current_user.id, role=BoardRole.owner)
    db.add(membership)

    db.commit()
    db.refresh(board)

    board_out = BoardOut.model_validate(board)
    board_out.my_role = BoardRole.owner
    return board_out


@router.get("/boards/{board_id}", response_model=BoardOut)
def get_board(
    board_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    board = get_board_or_404(board_id, db)
    membership = get_membership(board_id, current_user.id, db)
    if membership is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет доступа к доске")

    board_out = BoardOut.model_validate(board)
    board_out.my_role = membership.role
    return board_out


@router.patch("/boards/{board_id}", response_model=BoardOut)
def update_board(
    payload: BoardUpdate,
    board_and_membership: tuple[Board, BoardMember] = Depends(require_board_role(BoardRole.writer)),
    db: Session = Depends(get_db),
):
    board, membership = board_and_membership
    if payload.title is not None:
        board.title = payload.title
    if payload.description is not None:
        board.description = payload.description

    db.commit()
    db.refresh(board)

    board_out = BoardOut.model_validate(board)
    board_out.my_role = membership.role
    return board_out


@router.delete("/boards/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_board(
    board_and_membership: tuple[Board, BoardMember] = Depends(require_board_role(BoardRole.owner)),
    db: Session = Depends(get_db),
):
    board, _ = board_and_membership
    db.delete(board)  # каскадно удалит columns/cards/comments/members
    db.commit()


# ---------- Участники доски ----------


@router.get("/boards/{board_id}/members", response_model=list[BoardMemberOut])
def list_members(
    board_and_membership: tuple[Board, BoardMember] = Depends(require_board_role(BoardRole.reader)),
    db: Session = Depends(get_db),
):
    board, _ = board_and_membership
    return db.query(BoardMember).filter(BoardMember.board_id == board.id).all()


@router.post("/boards/{board_id}/members", response_model=BoardMemberOut, status_code=status.HTTP_201_CREATED)
def add_member(
    payload: BoardMemberAdd,
    board_and_membership: tuple[Board, BoardMember] = Depends(require_board_role(BoardRole.owner)),
    db: Session = Depends(get_db),
):
    board, _ = board_and_membership

    user = db.get(User, payload.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    existing = get_membership(board.id, payload.user_id, db)
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Пользователь уже в доске")

    membership = BoardMember(board_id=board.id, user_id=payload.user_id, role=payload.role)
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


@router.patch("/boards/{board_id}/members/{user_id}", response_model=BoardMemberOut)
def update_member_role(
    user_id: int,
    payload: BoardMemberUpdate,
    board_and_membership: tuple[Board, BoardMember] = Depends(require_board_role(BoardRole.owner)),
    db: Session = Depends(get_db),
):
    board, _ = board_and_membership
    membership = get_membership(board.id, user_id, db)
    if membership is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Участник не найден")

    if membership.user_id == board.owner_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Нельзя изменить роль владельца доски")

    membership.role = payload.role
    db.commit()
    db.refresh(membership)
    return membership


@router.delete("/boards/{board_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    user_id: int,
    board_and_membership: tuple[Board, BoardMember] = Depends(require_board_role(BoardRole.owner)),
    db: Session = Depends(get_db),
):
    board, _ = board_and_membership
    membership = get_membership(board.id, user_id, db)
    if membership is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Участник не найден")

    if membership.user_id == board.owner_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Нельзя удалить владельца доски")

    db.delete(membership)
    db.commit()

from fastapi import Depends, HTTPException, Path, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models import Board, BoardMember, BoardRole, User

bearer_scheme = HTTPBearer(auto_error=False)

# Иерархия ролей: чем больше число - тем больше прав.
# reader может только читать, writer - читать/писать, owner - всё, включая управление участниками.
_ROLE_LEVEL = {BoardRole.reader: 1, BoardRole.writer: 2, BoardRole.owner: 3}


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Не передан токен авторизации")

    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Невалидный или истёкший токен")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Пользователь не найден")

    return user


def get_board_or_404(board_id: int, db: Session) -> Board:
    board = db.get(Board, board_id)
    if board is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Доска не найдена")
    return board


def get_membership(board_id: int, user_id: int, db: Session) -> BoardMember | None:
    return (
        db.query(BoardMember)
        .filter(BoardMember.board_id == board_id, BoardMember.user_id == user_id)
        .first()
    )


def ensure_role(db: Session, user_id: int, board_id: int, min_role: BoardRole) -> BoardMember:
    """Проверяет, что пользователь - участник доски board_id с ролью не ниже min_role.
    Используется напрямую в ручках колонок/карточек/комментариев, где board_id
    приходится сначала вычислить (через column_id или card_id), а не берётся из path.
    """
    membership = get_membership(board_id, user_id, db)
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Вы не являетесь участником этой доски"
        )
    if _ROLE_LEVEL[membership.role] < _ROLE_LEVEL[min_role]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Недостаточно прав. Требуется роль не ниже '{min_role.value}'",
        )
    return membership


def require_board_role(min_role: BoardRole):
    """Фабрика зависимостей: проверяет, что текущий пользователь - участник доски
    с ролью не ниже min_role. Возвращает (board, membership) для использования в ручке.

    Пример: Depends(require_board_role(BoardRole.writer))
    """

    def _dependency(
        board_id: int = Path(...),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> tuple[Board, BoardMember]:
        board = get_board_or_404(board_id, db)
        membership = get_membership(board_id, current_user.id, db)

        if membership is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Вы не являетесь участником этой доски"
            )

        if _ROLE_LEVEL[membership.role] < _ROLE_LEVEL[min_role]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Недостаточно прав. Требуется роль не ниже '{min_role.value}'",
            )

        return board, membership

    return _dependency

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models import User
from app.schemas.user import UserPublic

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserPublic])
def search_users(
    search: str = Query(min_length=1, max_length=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Поиск пользователей по username - для формы добавления участника в доску."""
    return (
        db.query(User)
        .filter(User.username.ilike(f"%{search}%"))
        .filter(User.id != current_user.id)
        .limit(20)
        .all()
    )

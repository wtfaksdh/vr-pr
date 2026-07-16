from datetime import datetime

from pydantic import BaseModel, Field

from app.models import BoardRole
from app.schemas.user import UserPublic


class BoardCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None


class BoardUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None


class BoardOut(BaseModel):
    id: int
    title: str
    description: str | None
    owner_id: int
    created_at: datetime
    updated_at: datetime
    my_role: BoardRole | None = None  # роль текущего пользователя на этой доске

    class Config:
        from_attributes = True


class BoardMemberAdd(BaseModel):
    user_id: int
    role: BoardRole = BoardRole.reader


class BoardMemberUpdate(BaseModel):
    role: BoardRole


class BoardMemberOut(BaseModel):
    id: int
    user: UserPublic
    role: BoardRole
    joined_at: datetime

    class Config:
        from_attributes = True

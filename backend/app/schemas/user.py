from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    display_name: str = Field(min_length=1, max_length=100)


class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    display_name: str
    avatar_url: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserPublic(BaseModel):
    """Урезанная версия пользователя - для показа в списках участников, исполнителей и т.д."""

    id: int
    username: str
    display_name: str
    avatar_url: str | None = None

    class Config:
        from_attributes = True

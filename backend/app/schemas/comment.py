from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.user import UserPublic


class CommentCreate(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class CommentOut(BaseModel):
    id: int
    card_id: int
    user: UserPublic
    text: str
    created_at: datetime

    class Config:
        from_attributes = True

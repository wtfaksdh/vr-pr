from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.user import UserPublic


class CardCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    description: str | None = None
    position: int | None = None
    assignee_id: int | None = None
    due_date: datetime | None = None


class CardUpdate(BaseModel):
    """Используется и для редактирования полей, и для перемещения карточки (drag&drop).

    version обязателен - это защита от коллизий (optimistic locking):
    сервер применит изменения, только если version совпадает с текущим в БД.
    """

    title: str | None = Field(default=None, min_length=1, max_length=300)
    description: str | None = None
    column_id: int | None = None  # если задан - карточку переносят в другую колонку
    position: int | None = None
    assignee_id: int | None = None
    due_date: datetime | None = None
    version: int = Field(..., description="Версия карточки, известная клиенту")


class CardOut(BaseModel):
    id: int
    column_id: int
    title: str
    description: str | None
    position: int
    assignee: UserPublic | None = None
    author: UserPublic | None = None
    due_date: datetime | None
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

from datetime import datetime

from pydantic import BaseModel, Field


class ColumnCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    position: int | None = None  # если не передан - ставим в конец


class ColumnUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    position: int | None = None


class ColumnOut(BaseModel):
    id: int
    board_id: int
    title: str
    position: int
    created_at: datetime

    class Config:
        from_attributes = True

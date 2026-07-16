from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,   # переподключение, если MySQL закрыл простаивающий коннект
    pool_recycle=3600,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency для FastAPI: одна сессия на один запрос."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

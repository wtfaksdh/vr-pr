import enum

from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base

# На MySQL это обычный BIGINT. Вариант для sqlite нужен только потому, что
# SQLite включает автоинкремент через rowid лишь для колонок типа INTEGER PRIMARY KEY -
# используется исключительно в smoke_test.py, на проде эффекта не имеет.
PK = BigInteger().with_variant(Integer, "sqlite")


class BoardRole(str, enum.Enum):
    owner = "owner"
    writer = "writer"
    reader = "reader"


class User(Base):
    __tablename__ = "users"

    id = Column(PK, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(100), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    owned_boards = relationship("Board", back_populates="owner", foreign_keys="Board.owner_id")
    memberships = relationship("BoardMember", back_populates="user")


class Board(Base):
    __tablename__ = "boards"

    id = Column(PK, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="owned_boards", foreign_keys=[owner_id])
    members = relationship("BoardMember", back_populates="board", cascade="all, delete-orphan")
    columns = relationship(
        "BoardColumn", back_populates="board", cascade="all, delete-orphan", order_by="BoardColumn.position"
    )


class BoardMember(Base):
    __tablename__ = "board_members"
    __table_args__ = (UniqueConstraint("board_id", "user_id", name="uq_board_user"),)

    id = Column(PK, primary_key=True, autoincrement=True)
    board_id = Column(BigInteger, ForeignKey("boards.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum(BoardRole), nullable=False, default=BoardRole.reader)
    joined_at = Column(DateTime, server_default=func.now())

    board = relationship("Board", back_populates="members")
    user = relationship("User", back_populates="memberships")


# Название класса BoardColumn, а не Column - т.к. Column уже занято SQLAlchemy
class BoardColumn(Base):
    __tablename__ = "columns"

    id = Column(PK, primary_key=True, autoincrement=True)
    board_id = Column(BigInteger, ForeignKey("boards.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(100), nullable=False)
    position = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, server_default=func.now())

    board = relationship("Board", back_populates="columns")
    cards = relationship(
        "Card", back_populates="column", cascade="all, delete-orphan", order_by="Card.position"
    )


class Card(Base):
    __tablename__ = "cards"

    id = Column(PK, primary_key=True, autoincrement=True)
    column_id = Column(BigInteger, ForeignKey("columns.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    position = Column(Integer, nullable=False, default=0)
    assignee_id = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    due_date = Column(DateTime, nullable=True)
    created_by = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    version = Column(Integer, nullable=False, default=1)  # optimistic locking
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    column = relationship("BoardColumn", back_populates="cards")
    assignee = relationship("User", foreign_keys=[assignee_id])
    author = relationship("User", foreign_keys=[created_by])
    comments = relationship("Comment", back_populates="card", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(PK, primary_key=True, autoincrement=True)
    card_id = Column(BigInteger, ForeignKey("cards.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    card = relationship("Card", back_populates="comments")
    user = relationship("User")

"""Быстрая проверка, что весь стек API работает end-to-end.
Использует SQLite вместо MySQL (только для этого теста), поэтому
никакая внешняя БД не нужна - удобно гонять локально перед коммитом.

Запуск: python scripts/smoke_test.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,  # без этого каждое новое соединение открывает отдельную пустую in-memory БД
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def check(condition, message):
    status = "OK " if condition else "FAIL"
    print(f"[{status}] {message}")
    if not condition:
        raise SystemExit(1)


print("=== 1. Регистрация двух пользователей ===")
r1 = client.post("/auth/register", json={
    "username": "alice", "email": "alice@example.com",
    "password": "password123", "display_name": "Alice"
})
check(r1.status_code == 201, f"register alice -> {r1.status_code}")

r2 = client.post("/auth/register", json={
    "username": "bob", "email": "bob@example.com",
    "password": "password123", "display_name": "Bob"
})
check(r2.status_code == 201, f"register bob -> {r2.status_code}")
bob_id = r2.json()["id"]

print("\n=== 2. Логин Alice, получение JWT ===")
r = client.post("/auth/login", json={"username": "alice", "password": "password123"})
check(r.status_code == 200, f"login alice -> {r.status_code}")
alice_token = r.json()["access_token"]
alice_headers = {"Authorization": f"Bearer {alice_token}"}

print("\n=== 3. Неверный пароль отклоняется ===")
r = client.post("/auth/login", json={"username": "alice", "password": "wrong"})
check(r.status_code == 401, f"wrong password -> {r.status_code}")

print("\n=== 4. Alice создаёт доску (автоматически становится owner) ===")
r = client.post("/boards", json={"title": "Спринт 1", "description": "Тестовая доска"}, headers=alice_headers)
check(r.status_code == 201, f"create board -> {r.status_code}")
board = r.json()
check(board["my_role"] == "owner", f"my_role after create -> {board['my_role']}")
board_id = board["id"]

print("\n=== 5. Alice добавляет Bob как writer ===")
r = client.post(f"/boards/{board_id}/members", json={"user_id": bob_id, "role": "writer"}, headers=alice_headers)
check(r.status_code == 201, f"add member -> {r.status_code}")

print("\n=== 6. Bob логинится и видит доску в своём списке ===")
r = client.post("/auth/login", json={"username": "bob", "password": "password123"})
bob_token = r.json()["access_token"]
bob_headers = {"Authorization": f"Bearer {bob_token}"}

r = client.get("/boards", headers=bob_headers)
check(r.status_code == 200 and len(r.json()) == 1, "bob sees 1 board")
check(r.json()[0]["my_role"] == "writer", f"bob's role -> {r.json()[0]['my_role']}")

print("\n=== 7. Alice создаёт колонки ===")
r = client.post(f"/boards/{board_id}/columns", json={"title": "Очередь"}, headers=alice_headers)
col_todo = r.json()["id"]
r = client.post(f"/boards/{board_id}/columns", json={"title": "В работе"}, headers=alice_headers)
col_in_progress = r.json()["id"]
check(r.status_code == 201, "create columns")

print("\n=== 8. Bob (writer) создаёт карточку ===")
r = client.post(f"/columns/{col_todo}/cards", json={"title": "Сделать презентацию"}, headers=bob_headers)
check(r.status_code == 201, f"bob creates card -> {r.status_code}")
card = r.json()
card_id = card["id"]
check(card["version"] == 1, f"initial version -> {card['version']}")

print("\n=== 9. Optimistic locking: конфликт при устаревшей version ===")
# Alice двигает карточку первой, с version=1 - должно пройти
r = client.patch(f"/cards/{card_id}", json={"column_id": col_in_progress, "version": 1}, headers=alice_headers)
check(r.status_code == 200, f"alice moves card -> {r.status_code}")
check(r.json()["version"] == 2, f"version incremented -> {r.json()['version']}")

# Bob пытается двинуть эту же карточку, но по старой version=1 (он ещё не знал про ход Alice)
r = client.patch(f"/cards/{card_id}", json={"column_id": col_todo, "version": 1}, headers=bob_headers)
check(r.status_code == 409, f"bob's stale move rejected -> {r.status_code}")

# Bob подтягивает актуальную карточку и повторяет с правильной version=2 - должно пройти
r = client.get(f"/cards/{card_id}", headers=bob_headers)
fresh_version = r.json()["version"]
r = client.patch(f"/cards/{card_id}", json={"column_id": col_todo, "version": fresh_version}, headers=bob_headers)
check(r.status_code == 200, f"bob retries with fresh version -> {r.status_code}")

print("\n=== 10. Комментарий к карточке ===")
r = client.post(f"/cards/{card_id}/comments", json={"text": "Не забыть про дедлайн"}, headers=bob_headers)
check(r.status_code == 201, f"add comment -> {r.status_code}")

print("\n=== 11. Reader-доступ: пользователь без членства в доске получает 403 ===")
r = client.post("/auth/register", json={
    "username": "carol", "email": "carol@example.com",
    "password": "password123", "display_name": "Carol"
})
r = client.post("/auth/login", json={"username": "carol", "password": "password123"})
carol_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}

r = client.get(f"/boards/{board_id}", headers=carol_headers)
check(r.status_code == 403, f"carol (not a member) -> {r.status_code}")

print("\n=== 12. Reader не может создавать карточки (RBAC) ===")
# добавим carol как reader и проверим, что ей запрещено писать
carol_id = client.get("/auth/me", headers=carol_headers).json()["id"]
client.post(f"/boards/{board_id}/members", json={"user_id": carol_id, "role": "reader"}, headers=alice_headers)
r = client.post(f"/columns/{col_todo}/cards", json={"title": "Попытка reader'а"}, headers=carol_headers)
check(r.status_code == 403, f"reader blocked from writing -> {r.status_code}")

print("\nВСЕ ПРОВЕРКИ ПРОЙДЕНЫ УСПЕШНО")

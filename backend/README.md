# VK Kanban — Backend

Backend для учебного проекта Kanban-доски (практика в VK). FastAPI + MySQL + SQLAlchemy.

## Стек

- **Python 3.12 / FastAPI** — REST API
- **MySQL 8** — БД
- **SQLAlchemy 2.0** — ORM
- **JWT** (PyJWT) — авторизация, **bcrypt** (passlib) — хэширование паролей
- **Docker Compose** — локальный запуск backend + MySQL одной командой

## Структура проекта

```
backend/
├── app/
│   ├── main.py          # точка входа, подключение роутеров, CORS
│   ├── config.py         # настройки из .env
│   ├── database.py       # engine, session, Base
│   ├── models.py         # SQLAlchemy-модели (users, boards, board_members, columns, cards, comments)
│   ├── schemas/           # Pydantic-схемы запросов/ответов
│   ├── core/
│   │   ├── security.py   # хэширование паролей, создание/проверка JWT
│   │   └── deps.py       # get_current_user, проверка ролей (RBAC)
│   └── routers/           # эндпоинты: auth, users, boards, columns, cards, comments
├── migrations/
│   └── 001_init.sql       # SQL-схема БД
├── scripts/
│   └── smoke_test.py     # end-to-end проверка API на SQLite (без внешней БД)
├── docker-compose.yml
├── Dockerfile
└── requirements.txt
```

## Модель доступа (RBAC)

Роли на уровне доски: `owner` → `writer` → `reader` (по убыванию прав).

| Роль | Читать доску/колонки/карточки | Создавать/редактировать/двигать карточки, колонки | Управлять участниками, удалять доску |
|---|---|---|---|
| reader | да | нет | нет |
| writer | да | да | нет |
| owner | да | да | да |

Роль проверяется на каждый запрос через зависимость FastAPI (`app/core/deps.py`), а не на фронте — то есть даже прямой запрос к API от reader с попыткой создать карточку получит `403`.

## Защита от коллизий (optimistic locking)

У каждой карточки есть поле `version`. При любом изменении карточки (`PATCH /cards/{id}`) клиент обязан передать `version`, которую он видел последней. Обновление в БД выполняется атомарно:

```sql
UPDATE cards SET ..., version = version + 1 WHERE id = ? AND version = ?
```

Если версия в БД уже другая (кто-то успел изменить карточку раньше) — сервер вернёт `409 Conflict`, и фронт должен перезапросить актуальное состояние карточки, а не затирать чужие изменения.

## Запуск через Docker (рекомендуется)

```bash
cd backend
cp .env.example .env      # при необходимости поменять пароли/секрет
docker compose up -d --build
```

После запуска:
- API доступен на `http://localhost:8000`
- Swagger-документация (все эндпоинты, можно тестировать прямо в браузере): `http://localhost:8000/docs`
- MySQL — на `localhost:3306`, схема применяется автоматически при первом старте (файлы из `migrations/` монтируются в `/docker-entrypoint-initdb.d`)

Проверить, что всё поднялось:
```bash
curl http://localhost:8000/health
# {"status": "ok"}
```

## Запуск без Docker (локальная разработка)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# в .env указать DB_HOST=localhost и данные своей локальной MySQL

# применить миграцию к уже поднятой локальной MySQL:
mysql -u root -p < migrations/001_init.sql

uvicorn app.main:app --reload
```

## Проверка работоспособности API

Есть скрипт, который прогоняет полный сценарий (регистрация → логин → доска → участники → колонки → карточки → **коллизия при перемещении карточки** → комментарии → проверка RBAC) на SQLite в памяти, без необходимости поднимать MySQL:

```bash
pip install -r requirements.txt httpx
python3 scripts/smoke_test.py
```

## Основные эндпоинты

| Метод | Путь | Доступ |
|---|---|---|
| POST | `/auth/register` | публичный |
| POST | `/auth/login` | публичный |
| GET | `/auth/me` | любой авторизованный |
| GET | `/users?search=` | любой авторизованный |
| GET / POST | `/boards` | владелец списка / любой авторизованный |
| GET / PATCH / DELETE | `/boards/{id}` | reader / writer / owner |
| GET / POST | `/boards/{id}/members` | reader / owner |
| PATCH / DELETE | `/boards/{id}/members/{user_id}` | owner |
| GET / POST | `/boards/{id}/columns` | reader / writer |
| PATCH / DELETE | `/columns/{id}` | writer |
| GET / POST | `/columns/{id}/cards` | reader / writer |
| GET / PATCH / DELETE | `/cards/{id}` | reader / writer / writer |
| GET / POST | `/cards/{id}/comments` | reader / writer |
| DELETE | `/comments/{id}` | автор комментария или owner доски |

Полный список параметров и схем запросов — в Swagger (`/docs`) после запуска.

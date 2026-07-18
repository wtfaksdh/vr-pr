# VK Kanban Practice

Учебный проект практики в VK: канбан-доска (аналог Trello), встроенная как один из разделов
в клон интерфейса VK. Полностью рабочие часть — «Лента» (заглушка) и «Канбан» (полноценный
функционал с авторизацией, ролями, drag&drop и защитой от коллизий).

## Структура репозитория

```
vk-kanban-practice/
├── README.md              # этот файл
├── docker-compose.yml      # поднимает backend + MySQL + frontend одной командой
├── backend/                # FastAPI + MySQL + SQLAlchemy
│   └── README.md            # подробности по API, RBAC, optimistic locking
└── frontend/                # React + TypeScript + Vite
    └── README.md             # подробности по компонентам и сборке
```

Подробное описание каждой части — в `backend/README.md` и `frontend/README.md`. Здесь —
только про запуск всего стека сразу.

## Быстрый старт 
(бэк)
```bash
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
(фронт)
```bash
cd frontend
npm run dev -- --host
```
Через Docker
```
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up -d --build
```
После запуска:
- Frontend: **http://localhost:5173**
- Backend / Swagger-документация: **http://localhost:8000/docs**
- MySQL: `localhost:3306`

Схема БД применяется автоматически при первом старте контейнера с MySQL
(файлы из `backend/migrations/` монтируются в `/docker-entrypoint-initdb.d`).



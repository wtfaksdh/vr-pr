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

## Быстрый старт (Docker)

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

docker compose up -d --build
```

После запуска:
- Frontend: **http://localhost:8080**
- Backend / Swagger-документация: **http://localhost:8000/docs**
- MySQL: `localhost:3306`

Схема БД применяется автоматически при первом старте контейнера с MySQL
(файлы из `backend/migrations/` монтируются в `/docker-entrypoint-initdb.d`).

## Если деплоите на VPS (не localhost)

`VITE_API_URL` вшивается в сборку фронтенда **на этапе `docker compose build`** — это
переменная окружения браузера времени сборки, а не времени выполнения. Если backend будет
доступен не по `localhost:8000`, а, например, по IP/домену вашего сервера, укажите это явно
перед сборкой:

```bash
VITE_API_URL=http://<ваш-ip-или-домен>:8000 docker compose up -d --build
```

Также не забудьте открыть нужные порты (`8080`, `8000`) в firewall сервера и проверить, что
они не заняты другими сервисами (см. заметку про совмещение с VPN на сервере — при
необходимости используйте другие порты через `ports:` в `docker-compose.yml`).

## Проверка, что backend работает сам по себе

Не поднимая MySQL и фронт, можно быстро прогнать сквозной сценарий API
(регистрация → доска → роли → drag&drop → коллизия версий → комментарии):

```bash
cd backend
pip install -r requirements.txt httpx --break-system-packages
python3 scripts/smoke_test.py
```

## Что учтено из требований задания

- Пользователи + доступ: регистрация/логин (JWT), у доски есть владелец и участники с ролями.
- Доски/колонки/карточки: полный CRUD, порядок карточек в колонке, drag&drop между колонками.
- Комментарии к карточкам.
- RBAC: три роли (`owner` / `writer` / `reader`), проверяются на backend, а не только в UI.
- Защита от коллизий: optimistic locking через поле `version` у карточек (409 при конфликте).
- Пароли хранятся только в виде bcrypt-хэшей.

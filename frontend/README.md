# VK Kanban — Frontend

Веб-интерфейс практики: стилизован под тёмный интерфейс VK, но с рабочим функционалом только
в двух местах — «Лента» (статичная заглушка) и «Канбан» (полноценная доска). Остальные пункты
меню — задуманные декоративные заглушки: при клике показывают тост «недоступно в демо».

## Стек

- **React 18 + TypeScript**
- **Vite** — сборка и дев-сервер
- **React Router v6** — роутинг
- **@hello-pangea/dnd** — drag&drop карточек между колонками
- Обычный CSS с переменными темы (без UI-фреймворков) — `src/styles/index.css`

## Структура

```
frontend/
├── src/
│   ├── api/              # обёртки над fetch под каждый ресурс backend
│   │   ├── client.ts      # базовый запрос: подставляет JWT, парсит ошибки
│   │   ├── auth.ts, boards.ts, columns.ts, cards.ts, comments.ts, users.ts
│   ├── context/
│   │   ├── AuthContext.tsx    # текущий пользователь, login/register/logout
│   │   └── ToastContext.tsx   # всплывающие уведомления
│   ├── components/
│   │   ├── layout/         # Header, Sidebar (с заглушками), AppLayout, ProtectedRoute
│   │   ├── feed/            # FeedStub, PostCardStub - статичная лента
│   │   └── kanban/          # BoardList, BoardView, ColumnView, CardItem, CardModal, MembersModal
│   ├── pages/               # LoginPage, FeedPage, BoardsPage, BoardDetailPage
│   ├── types/                # TS-типы, зеркалящие Pydantic-схемы backend
│   ├── App.tsx / main.tsx
│   └── styles/index.css      # вся тема и вёрстка
├── Dockerfile                 # сборка + раздача через nginx
├── nginx.conf
└── package.json
```

## Что реально работает

- **Регистрация / логин** — JWT хранится в `localStorage`, подставляется во все запросы.
- **Лента** — открывается по клику, но это статичный мокап без реального контента (никаких
  настоящих постов/фото не подгружается и не публикуется).
- **Канбан**:
  - список досок пользователя, создание новой доски;
  - доска: колонки, карточки, **drag&drop** между колонками и внутри колонки;
  - карточка: название, описание, исполнитель, дедлайн, комментарии;
  - участники доски и роли (`owner` / `writer` / `reader`) — UI подстраивается под роль:
    `reader` видит доску, но не может ничего создавать/двигать/удалять.
- **Обработка коллизий**: если карточку успел изменить кто-то другой (сервер вернул `409`),
  фронт не затирает чужие изменения молча — подтягивает актуальную версию карточки и
  показывает тост об этом.

## Запуск локально (без Docker)

```bash
cd frontend
npm install
cp .env.example .env      # проверить/поменять VITE_API_URL, если backend не на localhost:8000
npm run dev
```

Приложение поднимется на `http://localhost:5173`. Backend должен быть уже запущен
(см. `backend/README.md`).

## Запуск через Docker

```bash
docker build -t vk-kanban-frontend --build-arg VITE_API_URL=http://localhost:8000 .
docker run -p 5173:80 vk-kanban-frontend
```

Либо через общий `docker-compose.yml` в корне репозитория — поднимает backend, MySQL и
frontend одной командой (см. корневой README).

## Важное про VITE_API_URL

Vite подставляет переменные окружения **на этапе сборки**, а не во время выполнения в
браузере. Если backend разворачивается не на `localhost:8000` (например, на VPS или в
локальной сети под другим IP) — нужно пересобрать фронт с новым `VITE_API_URL`, а не просто
поменять `.env` у уже собранного `dist/`.

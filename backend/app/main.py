from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, boards, cards, columns, comments, users

app = FastAPI(title="VK Kanban API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    # ngrok на бесплатном плане каждый раз выдаёт новый поддомен - без regex
    # пришлось бы вручную обновлять CORS_ORIGINS в .env при каждом перезапуске
    allow_origin_regex=r"https://.*\.ngrok-free\.app|https://.*\.ngrok\.io",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(boards.router)
app.include_router(columns.router)
app.include_router(cards.router)
app.include_router(comments.router)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}

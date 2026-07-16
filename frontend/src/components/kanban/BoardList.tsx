import { useState } from "react";
import type { Board } from "../../types";

interface BoardListProps {
  boards: Board[];
  onOpen: (boardId: number) => void;
  onCreate: (payload: { title: string; description?: string }) => Promise<void>;
}

export function BoardList({ boards, onOpen, onCreate }: BoardListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setIsSaving(true);
    try {
      await onCreate({ title: trimmed, description: description.trim() || undefined });
      setTitle("");
      setDescription("");
      setIsCreating(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="board-list">
      <div className="board-list__header">
        <h1>Мои доски</h1>
        {!isCreating && (
          <button className="btn btn--primary" onClick={() => setIsCreating(true)}>
            + Создать доску
          </button>
        )}
      </div>

      {isCreating && (
        <div className="board-list__create-form">
          <input
            autoFocus
            placeholder="Название доски"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="Описание (необязательно)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="board-list__create-actions">
            <button className="btn btn--primary btn--sm" disabled={isSaving} onClick={submit}>
              {isSaving ? "Создаём…" : "Создать"}
            </button>
            <button className="btn btn--ghost btn--sm" onClick={() => setIsCreating(false)}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {boards.length === 0 && !isCreating ? (
        <div className="empty-state">
          <p>Пока нет ни одной доски.</p>
          <button className="btn btn--primary" onClick={() => setIsCreating(true)}>
            Создать первую доску
          </button>
        </div>
      ) : (
        <div className="board-list__grid">
          {boards.map((board) => (
            <div key={board.id} className="board-card" onClick={() => onOpen(board.id)}>
              <div className="board-card__title">{board.title}</div>
              {board.description && <div className="board-card__description">{board.description}</div>}
              <span className={`role-badge role-badge--${board.my_role}`}>{roleLabel(board.my_role)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function roleLabel(role: Board["my_role"]) {
  switch (role) {
    case "owner":
      return "Владелец";
    case "writer":
      return "Редактор";
    case "reader":
      return "Читатель";
    default:
      return "";
  }
}

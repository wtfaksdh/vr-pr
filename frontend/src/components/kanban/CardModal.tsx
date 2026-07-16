import { useEffect, useState } from "react";
import * as cardsApi from "../../api/cards";
import * as commentsApi from "../../api/comments";
import * as boardsApi from "../../api/boards";
import { ApiError } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import type { Card, Comment, BoardMember } from "../../types";

interface CardModalProps {
  cardId: number;
  boardId: number;
  canWrite: boolean;
  onClose: () => void;
  onUpdated: (card: Card) => void;
  onDeleted: (cardId: number) => void;
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CardModal({ cardId, boardId, canWrite, onClose, onUpdated, onDeleted }: CardModalProps) {
  const { showToast } = useToast();

  const [card, setCard] = useState<Card | null>(null);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [titleDraft, setTitleDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [assigneeDraft, setAssigneeDraft] = useState<number | "">("");
  const [dueDateDraft, setDueDateDraft] = useState("");

  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    Promise.all([cardsApi.getCard(cardId), boardsApi.listMembers(boardId), commentsApi.listComments(cardId)])
      .then(([fetchedCard, fetchedMembers, fetchedComments]) => {
        if (cancelled) return;
        applyCardToDrafts(fetchedCard);
        setMembers(fetchedMembers);
        setComments(fetchedComments);
      })
      .catch(() => showToast("Не удалось загрузить карточку", "error"))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);

  function applyCardToDrafts(c: Card) {
    setCard(c);
    setTitleDraft(c.title);
    setDescriptionDraft(c.description ?? "");
    setAssigneeDraft(c.assignee?.id ?? "");
    setDueDateDraft(toDatetimeLocal(c.due_date));
  }

  const isDirty =
    card !== null &&
    (titleDraft !== card.title ||
      descriptionDraft !== (card.description ?? "") ||
      assigneeDraft !== (card.assignee?.id ?? "") ||
      dueDateDraft !== toDatetimeLocal(card.due_date));

  async function handleSave() {
    if (!card) return;
    setIsSaving(true);
    try {
      const updated = await cardsApi.updateCard(card.id, {
        title: titleDraft.trim() || card.title,
        description: descriptionDraft,
        assignee_id: assigneeDraft === "" ? null : assigneeDraft,
        due_date: dueDateDraft ? new Date(dueDateDraft).toISOString() : null,
        version: card.version,
      });
      applyCardToDrafts(updated);
      onUpdated(updated);
      showToast("Изменения сохранены");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const fresh = await cardsApi.getCard(card.id);
        applyCardToDrafts(fresh);
        onUpdated(fresh);
        showToast("Карточку успел изменить кто-то другой. Показываем актуальную версию — попробуйте снова", "error");
      } else {
        showToast(err instanceof ApiError ? err.detail : "Не удалось сохранить изменения", "error");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!card) return;
    if (!confirm("Удалить карточку без возможности восстановления?")) return;
    try {
      await cardsApi.deleteCard(card.id);
      onDeleted(card.id);
      onClose();
    } catch (err) {
      showToast(err instanceof ApiError ? err.detail : "Не удалось удалить карточку", "error");
    }
  }

  async function handleAddComment() {
    if (!card || !newComment.trim()) return;
    try {
      const comment = await commentsApi.addComment(card.id, newComment.trim());
      setComments((prev) => [...prev, comment]);
      setNewComment("");
    } catch (err) {
      showToast(err instanceof ApiError ? err.detail : "Не удалось отправить комментарий", "error");
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Карточка</h2>
          <button className="modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        {isLoading || !card ? (
          <div className="page-loading">Загрузка…</div>
        ) : (
          <div className="modal__body">
            <label className="field-label">Название</label>
            <input
              className="card-modal__title-input"
              value={titleDraft}
              disabled={!canWrite}
              onChange={(e) => setTitleDraft(e.target.value)}
            />

            <label className="field-label">Описание</label>
            <textarea
              rows={4}
              placeholder="Описание задачи…"
              value={descriptionDraft}
              disabled={!canWrite}
              onChange={(e) => setDescriptionDraft(e.target.value)}
            />

            <div className="card-modal__row">
              <div>
                <label className="field-label">Исполнитель</label>
                <select
                  value={assigneeDraft}
                  disabled={!canWrite}
                  onChange={(e) => setAssigneeDraft(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">Не назначен</option>
                  {members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Дедлайн</label>
                <input
                  type="datetime-local"
                  value={dueDateDraft}
                  disabled={!canWrite}
                  onChange={(e) => setDueDateDraft(e.target.value)}
                />
              </div>
            </div>

            {canWrite && (
              <div className="card-modal__actions">
                <button className="btn btn--primary" disabled={!isDirty || isSaving} onClick={handleSave}>
                  {isSaving ? "Сохраняем…" : "Сохранить"}
                </button>
                <button className="btn btn--danger-ghost" onClick={handleDelete}>
                  Удалить карточку
                </button>
              </div>
            )}

            <div className="card-modal__comments">
              <label className="field-label">Комментарии ({comments.length})</label>
              <div className="card-modal__comments-list">
                {comments.length === 0 && <div className="members-modal__hint">Пока нет комментариев</div>}
                {comments.map((c) => (
                  <div key={c.id} className="comment">
                    <div className="avatar avatar--xs">{c.user.display_name[0]?.toUpperCase()}</div>
                    <div className="comment__body">
                      <div className="comment__meta">
                        <span className="comment__author">{c.user.display_name}</span>
                        <span className="comment__time">
                          {new Date(c.created_at).toLocaleString("ru-RU", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div>{c.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              {canWrite && (
                <div className="card-modal__comment-form">
                  <input
                    placeholder="Написать комментарий…"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  />
                  <button className="btn btn--primary btn--sm" onClick={handleAddComment}>
                    Отправить
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import * as boardsApi from "../../api/boards";
import * as usersApi from "../../api/users";
import { ApiError } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import type { BoardMember, BoardRole, UserPublic } from "../../types";

interface MembersModalProps {
  boardId: number;
  canManage: boolean;
  onClose: () => void;
}

export function MembersModal({ boardId, canManage, onClose }: MembersModalProps) {
  const { showToast } = useToast();
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserPublic[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  async function loadMembers() {
    setIsLoading(true);
    try {
      setMembers(await boardsApi.listMembers(boardId));
    } catch {
      showToast("Не удалось загрузить участников", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch(query: string) {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await usersApi.searchUsers(query.trim());
      const memberIds = new Set(members.map((m) => m.user.id));
      setSearchResults(results.filter((u) => !memberIds.has(u.id)));
    } finally {
      setIsSearching(false);
    }
  }

  async function handleAdd(user: UserPublic, role: BoardRole) {
    try {
      await boardsApi.addMember(boardId, { user_id: user.id, role });
      setSearchQuery("");
      setSearchResults([]);
      await loadMembers();
      showToast(`${user.display_name} добавлен(а) в доску`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.detail : "Не удалось добавить участника", "error");
    }
  }

  async function handleRoleChange(userId: number, role: BoardRole) {
    try {
      await boardsApi.updateMemberRole(boardId, userId, role);
      await loadMembers();
    } catch (err) {
      showToast(err instanceof ApiError ? err.detail : "Не удалось изменить роль", "error");
    }
  }

  async function handleRemove(userId: number, name: string) {
    try {
      await boardsApi.removeMember(boardId, userId);
      await loadMembers();
      showToast(`${name} удалён(а) из доски`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.detail : "Не удалось удалить участника", "error");
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Участники доски</h2>
          <button className="modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal__body">
          {canManage && (
            <div className="members-modal__search">
              <input
                placeholder="Найти пользователя по username…"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {isSearching && <div className="members-modal__hint">Ищем…</div>}
              {searchResults.length > 0 && (
                <div className="members-modal__results">
                  {searchResults.map((user) => (
                    <div key={user.id} className="members-modal__result-row">
                      <div className="avatar avatar--sm">{user.display_name[0]?.toUpperCase()}</div>
                      <span>{user.display_name}</span>
                      <span className="members-modal__username">@{user.username}</span>
                      <button className="btn btn--primary btn--sm" onClick={() => handleAdd(user, "reader")}>
                        Добавить
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="page-loading">Загрузка…</div>
          ) : (
            <div className="members-modal__list">
              {members.map((m) => (
                <div key={m.id} className="members-modal__row">
                  <div className="avatar avatar--sm">{m.user.display_name[0]?.toUpperCase()}</div>
                  <div className="members-modal__row-info">
                    <div>{m.user.display_name}</div>
                    <div className="members-modal__username">@{m.user.username}</div>
                  </div>

                  {canManage && m.role !== "owner" ? (
                    <select
                      className="members-modal__role-select"
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.user.id, e.target.value as BoardRole)}
                    >
                      <option value="reader">Читатель</option>
                      <option value="writer">Редактор</option>
                    </select>
                  ) : (
                    <span className={`role-badge role-badge--${m.role}`}>{roleLabel(m.role)}</span>
                  )}

                  {canManage && m.role !== "owner" && (
                    <button
                      className="icon-btn icon-btn--danger"
                      title="Удалить из доски"
                      onClick={() => handleRemove(m.user.id, m.user.display_name)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function roleLabel(role: BoardRole) {
  switch (role) {
    case "owner":
      return "Владелец";
    case "writer":
      return "Редактор";
    case "reader":
      return "Читатель";
  }
}

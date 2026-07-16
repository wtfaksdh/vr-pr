import { useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import type { Board, ColumnWithCards } from "../../types";
import { ColumnView } from "./ColumnView";

interface BoardViewProps {
  board: Board;
  columns: ColumnWithCards[];
  canWrite: boolean;
  canManageMembers: boolean;
  onOpenCard: (cardId: number) => void;
  onOpenMembers: () => void;
  onDragEnd: (result: DropResult) => void;
  onCreateCard: (columnId: number, title: string) => void;
  onCreateColumn: (title: string) => void;
  onRenameColumn: (columnId: number, title: string) => void;
  onDeleteColumn: (columnId: number) => void;
}

export function BoardView({
  board,
  columns,
  canWrite,
  canManageMembers,
  onOpenCard,
  onOpenMembers,
  onDragEnd,
  onCreateCard,
  onCreateColumn,
  onRenameColumn,
  onDeleteColumn,
}: BoardViewProps) {
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");

  function submitNewColumn() {
    const title = newColumnTitle.trim();
    if (title) onCreateColumn(title);
    setNewColumnTitle("");
    setIsAddingColumn(false);
  }

  return (
    <div className="board-view">
      <div className="board-view__header">
        <div>
          <h1 className="board-view__title">{board.title}</h1>
          {board.description && <p className="board-view__description">{board.description}</p>}
        </div>
        <div className="board-view__header-actions">
          <span className={`role-badge role-badge--${board.my_role}`}>{roleLabel(board.my_role)}</span>
          <button className="btn btn--ghost btn--sm" onClick={onOpenMembers}>
            {canManageMembers ? "Управлять участниками" : "Участники"}
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="board-view__columns">
          {columns.map((column) => (
            <ColumnView
              key={column.id}
              column={column}
              canWrite={canWrite}
              onOpenCard={onOpenCard}
              onCreateCard={onCreateCard}
              onRenameColumn={onRenameColumn}
              onDeleteColumn={onDeleteColumn}
            />
          ))}

          {canWrite && (
            <div className="kanban-column kanban-column--add">
              {isAddingColumn ? (
                <div className="kanban-column__add-form">
                  <input
                    autoFocus
                    placeholder="Название колонки"
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitNewColumn();
                      if (e.key === "Escape") setIsAddingColumn(false);
                    }}
                  />
                  <div className="kanban-column__add-actions">
                    <button className="btn btn--primary btn--sm" onClick={submitNewColumn}>
                      Добавить
                    </button>
                    <button className="btn btn--ghost btn--sm" onClick={() => setIsAddingColumn(false)}>
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <button className="kanban-column__add-trigger" onClick={() => setIsAddingColumn(true)}>
                  + Добавить колонку
                </button>
              )}
            </div>
          )}
        </div>
      </DragDropContext>
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

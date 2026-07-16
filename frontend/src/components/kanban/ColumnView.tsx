import { useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import type { ColumnWithCards } from "../../types";
import { CardItem } from "./CardItem";

interface ColumnViewProps {
  column: ColumnWithCards;
  canWrite: boolean;
  onOpenCard: (cardId: number) => void;
  onCreateCard: (columnId: number, title: string) => void;
  onRenameColumn: (columnId: number, title: string) => void;
  onDeleteColumn: (columnId: number) => void;
}

export function ColumnView({
  column,
  canWrite,
  onOpenCard,
  onCreateCard,
  onRenameColumn,
  onDeleteColumn,
}: ColumnViewProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(column.title);

  function submitNewCard() {
    const title = newCardTitle.trim();
    if (title) {
      onCreateCard(column.id, title);
    }
    setNewCardTitle("");
    setIsAddingCard(false);
  }

  function submitTitle() {
    const title = titleDraft.trim();
    if (title && title !== column.title) {
      onRenameColumn(column.id, title);
    } else {
      setTitleDraft(column.title);
    }
    setIsEditingTitle(false);
  }

  return (
    <div className="kanban-column">
      <div className="kanban-column__header">
        {isEditingTitle ? (
          <input
            className="kanban-column__title-input"
            value={titleDraft}
            autoFocus
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={submitTitle}
            onKeyDown={(e) => e.key === "Enter" && submitTitle()}
          />
        ) : (
          <div
            className="kanban-column__title"
            onClick={() => canWrite && setIsEditingTitle(true)}
          >
            {column.title}
          </div>
        )}
        <span className="kanban-column__count">{column.cards.length}</span>
        {canWrite && (
          <button
            className="kanban-column__delete"
            title="Удалить колонку"
            onClick={() => onDeleteColumn(column.id)}
          >
            ✕
          </button>
        )}
      </div>

      <Droppable droppableId={String(column.id)}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`kanban-column__cards${snapshot.isDraggingOver ? " kanban-column__cards--over" : ""}`}
          >
            {column.cards.map((card, index) => (
              <CardItem key={card.id} card={card} index={index} onClick={() => onOpenCard(card.id)} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {canWrite &&
        (isAddingCard ? (
          <div className="kanban-column__add-form">
            <textarea
              autoFocus
              placeholder="Название карточки"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitNewCard();
                }
                if (e.key === "Escape") {
                  setIsAddingCard(false);
                  setNewCardTitle("");
                }
              }}
            />
            <div className="kanban-column__add-actions">
              <button className="btn btn--primary btn--sm" onClick={submitNewCard}>
                Добавить
              </button>
              <button className="btn btn--ghost btn--sm" onClick={() => setIsAddingCard(false)}>
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <button className="kanban-column__add-trigger" onClick={() => setIsAddingCard(true)}>
            + Добавить карточку
          </button>
        ))}
    </div>
  );
}

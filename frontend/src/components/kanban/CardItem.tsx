import { Draggable } from "@hello-pangea/dnd";
import type { Card } from "../../types";

interface CardItemProps {
  card: Card;
  index: number;
  onClick: () => void;
}

function formatDueDate(dueDate: string): { label: string; overdue: boolean } {
  const date = new Date(dueDate);
  const now = new Date();
  const label = date.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
  return { label, overdue: date.getTime() < now.getTime() };
}

export function CardItem({ card, index, onClick }: CardItemProps) {
  const due = card.due_date ? formatDueDate(card.due_date) : null;

  return (
    <Draggable draggableId={String(card.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`kanban-card${snapshot.isDragging ? " kanban-card--dragging" : ""}`}
          onClick={onClick}
        >
          <div className="kanban-card__title">{card.title}</div>

          {(due || card.assignee) && (
            <div className="kanban-card__footer">
              {due && (
                <span className={`kanban-card__due${due.overdue ? " kanban-card__due--overdue" : ""}`}>
                  {due.label}
                </span>
              )}
              {card.assignee && (
                <div className="avatar avatar--xs" title={card.assignee.display_name}>
                  {card.assignee.display_name[0]?.toUpperCase()}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

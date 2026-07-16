import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { DropResult } from "@hello-pangea/dnd";
import * as boardsApi from "../api/boards";
import * as columnsApi from "../api/columns";
import * as cardsApi from "../api/cards";
import { ApiError } from "../api/client";
import { useToast } from "../context/ToastContext";
import { BoardView } from "../components/kanban/BoardView";
import { CardModal } from "../components/kanban/CardModal";
import { MembersModal } from "../components/kanban/MembersModal";
import type { Board, Card, ColumnWithCards } from "../types";

export function BoardDetailPage() {
  const { boardId: boardIdParam } = useParams();
  const boardId = Number(boardIdParam);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<ColumnWithCards[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openCardId, setOpenCardId] = useState<number | null>(null);
  const [isMembersOpen, setIsMembersOpen] = useState(false);

  const loadBoard = useCallback(async () => {
    try {
      const [fetchedBoard, fetchedColumns] = await Promise.all([
        boardsApi.getBoard(boardId),
        columnsApi.listColumns(boardId),
      ]);
      const withCards: ColumnWithCards[] = await Promise.all(
        fetchedColumns.map(async (col) => ({
          ...col,
          cards: await cardsApi.listCards(col.id),
        }))
      );
      setBoard(fetchedBoard);
      setColumns(withCards);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        showToast("У вас нет доступа к этой доске", "error");
        navigate("/boards");
      } else {
        showToast("Не удалось загрузить доску", "error");
      }
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  useEffect(() => {
    setIsLoading(true);
    loadBoard();
  }, [loadBoard]);

  function applyCardPatch(updated: Card) {
    setColumns((prev) =>
      prev.map((col) => ({ ...col, cards: col.cards.map((c) => (c.id === updated.id ? updated : c)) }))
    );
  }

  function removeCardFromState(cardId: number) {
    setColumns((prev) => prev.map((col) => ({ ...col, cards: col.cards.filter((c) => c.id !== cardId) })));
  }

  async function persistReorder(affectedColumns: ColumnWithCards[], movedCardId: number, destColumnId: number) {
    try {
      for (const col of affectedColumns) {
        for (let index = 0; index < col.cards.length; index++) {
          const c = col.cards[index];
          const isMovedCard = c.id === movedCardId;
          if (c.position === index && !isMovedCard) continue;

          const updated = await cardsApi.updateCard(c.id, {
            position: index,
            version: c.version,
            ...(isMovedCard ? { column_id: destColumnId } : {}),
          });
          applyCardPatch(updated);
        }
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        showToast("Карточку успел изменить кто-то другой. Обновляем доску…", "error");
      } else {
        showToast("Не удалось сохранить перемещение карточки", "error");
      }
      await loadBoard();
    }
  }

  function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const cardId = Number(draggableId);
    const destColumnId = Number(destination.droppableId);

    setColumns((prevColumns) => {
      const cloned = prevColumns.map((c) => ({ ...c, cards: [...c.cards] }));
      const sourceCol = cloned.find((c) => String(c.id) === source.droppableId);
      const destCol = cloned.find((c) => String(c.id) === destination.droppableId);
      if (!sourceCol || !destCol) return prevColumns;

      const [moved] = sourceCol.cards.splice(source.index, 1);
      destCol.cards.splice(destination.index, 0, moved);

      const affected = sourceCol.id === destCol.id ? [destCol] : [sourceCol, destCol];
      persistReorder(affected, cardId, destColumnId);

      return cloned;
    });
  }

  async function handleCreateColumn(title: string) {
    try {
      const column = await columnsApi.createColumn(boardId, { title });
      setColumns((prev) => [...prev, { ...column, cards: [] }]);
    } catch (err) {
      showToast(err instanceof ApiError ? err.detail : "Не удалось создать колонку", "error");
    }
  }

  async function handleRenameColumn(columnId: number, title: string) {
    try {
      const updated = await columnsApi.updateColumn(columnId, { title });
      setColumns((prev) => prev.map((c) => (c.id === columnId ? { ...c, title: updated.title } : c)));
    } catch (err) {
      showToast(err instanceof ApiError ? err.detail : "Не удалось переименовать колонку", "error");
    }
  }

  async function handleDeleteColumn(columnId: number) {
    if (!confirm("Удалить колонку вместе со всеми карточками в ней?")) return;
    try {
      await columnsApi.deleteColumn(columnId);
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
    } catch (err) {
      showToast(err instanceof ApiError ? err.detail : "Не удалось удалить колонку", "error");
    }
  }

  async function handleCreateCard(columnId: number, title: string) {
    try {
      const card = await cardsApi.createCard(columnId, { title });
      setColumns((prev) => prev.map((c) => (c.id === columnId ? { ...c, cards: [...c.cards, card] } : c)));
    } catch (err) {
      showToast(err instanceof ApiError ? err.detail : "Не удалось создать карточку", "error");
    }
  }

  if (isLoading) {
    return <div className="page-loading">Загрузка…</div>;
  }

  if (!board) {
    return null;
  }

  const canWrite = board.my_role === "writer" || board.my_role === "owner";
  const canManageMembers = board.my_role === "owner";

  return (
    <>
      <BoardView
        board={board}
        columns={columns}
        canWrite={canWrite}
        canManageMembers={canManageMembers}
        onOpenCard={setOpenCardId}
        onOpenMembers={() => setIsMembersOpen(true)}
        onDragEnd={handleDragEnd}
        onCreateCard={handleCreateCard}
        onCreateColumn={handleCreateColumn}
        onRenameColumn={handleRenameColumn}
        onDeleteColumn={handleDeleteColumn}
      />

      {openCardId !== null && (
        <CardModal
          cardId={openCardId}
          boardId={boardId}
          canWrite={canWrite}
          onClose={() => setOpenCardId(null)}
          onUpdated={applyCardPatch}
          onDeleted={(cardId) => {
            removeCardFromState(cardId);
            setOpenCardId(null);
          }}
        />
      )}

      {isMembersOpen && (
        <MembersModal boardId={boardId} canManage={canManageMembers} onClose={() => setIsMembersOpen(false)} />
      )}
    </>
  );
}

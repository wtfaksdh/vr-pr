import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as boardsApi from "../api/boards";
import { ApiError } from "../api/client";
import { useToast } from "../context/ToastContext";
import { BoardList } from "../components/kanban/BoardList";
import type { Board } from "../types";

export function BoardsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    boardsApi
      .listBoards()
      .then(setBoards)
      .catch(() => showToast("Не удалось загрузить доски", "error"))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(payload: { title: string; description?: string }) {
    try {
      const board = await boardsApi.createBoard(payload);
      setBoards((prev) => [...prev, board]);
      navigate(`/boards/${board.id}`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.detail : "Не удалось создать доску", "error");
    }
  }

  if (isLoading) {
    return <div className="page-loading">Загрузка…</div>;
  }

  return <BoardList boards={boards} onOpen={(id) => navigate(`/boards/${id}`)} onCreate={handleCreate} />;
}

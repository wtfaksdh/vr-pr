import { apiRequest } from "./client";
import type { Column } from "../types";

export function listColumns(boardId: number) {
  return apiRequest<Column[]>(`/boards/${boardId}/columns`);
}

export function createColumn(boardId: number, payload: { title: string; position?: number }) {
  return apiRequest<Column>(`/boards/${boardId}/columns`, { method: "POST", body: payload });
}

export function updateColumn(columnId: number, payload: { title?: string; position?: number }) {
  return apiRequest<Column>(`/columns/${columnId}`, { method: "PATCH", body: payload });
}

export function deleteColumn(columnId: number) {
  return apiRequest<void>(`/columns/${columnId}`, { method: "DELETE" });
}

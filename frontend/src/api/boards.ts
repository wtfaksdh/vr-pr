import { apiRequest } from "./client";
import type { Board, BoardMember, BoardRole } from "../types";

export function listBoards() {
  return apiRequest<Board[]>("/boards");
}

export function createBoard(payload: { title: string; description?: string }) {
  return apiRequest<Board>("/boards", { method: "POST", body: payload });
}

export function getBoard(boardId: number) {
  return apiRequest<Board>(`/boards/${boardId}`);
}

export function updateBoard(boardId: number, payload: { title?: string; description?: string }) {
  return apiRequest<Board>(`/boards/${boardId}`, { method: "PATCH", body: payload });
}

export function deleteBoard(boardId: number) {
  return apiRequest<void>(`/boards/${boardId}`, { method: "DELETE" });
}

export function listMembers(boardId: number) {
  return apiRequest<BoardMember[]>(`/boards/${boardId}/members`);
}

export function addMember(boardId: number, payload: { user_id: number; role: BoardRole }) {
  return apiRequest<BoardMember>(`/boards/${boardId}/members`, { method: "POST", body: payload });
}

export function updateMemberRole(boardId: number, userId: number, role: BoardRole) {
  return apiRequest<BoardMember>(`/boards/${boardId}/members/${userId}`, {
    method: "PATCH",
    body: { role },
  });
}

export function removeMember(boardId: number, userId: number) {
  return apiRequest<void>(`/boards/${boardId}/members/${userId}`, { method: "DELETE" });
}

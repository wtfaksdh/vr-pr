import { apiRequest } from "./client";
import type { Comment } from "../types";

export function listComments(cardId: number) {
  return apiRequest<Comment[]>(`/cards/${cardId}/comments`);
}

export function addComment(cardId: number, text: string) {
  return apiRequest<Comment>(`/cards/${cardId}/comments`, { method: "POST", body: { text } });
}

export function deleteComment(commentId: number) {
  return apiRequest<void>(`/comments/${commentId}`, { method: "DELETE" });
}

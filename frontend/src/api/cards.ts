import { apiRequest } from "./client";
import type { Card } from "../types";

export function listCards(columnId: number) {
  return apiRequest<Card[]>(`/columns/${columnId}/cards`);
}

export function createCard(
  columnId: number,
  payload: { title: string; description?: string; position?: number; assignee_id?: number | null; due_date?: string | null }
) {
  return apiRequest<Card>(`/columns/${columnId}/cards`, { method: "POST", body: payload });
}

export function getCard(cardId: number) {
  return apiRequest<Card>(`/cards/${cardId}`);
}

/** version обязателен - это и есть защита от коллизий (optimistic locking).
 * При несовпадении версии backend вернёт ApiError со статусом 409. */
export interface CardUpdatePayload {
  title?: string;
  description?: string;
  column_id?: number;
  position?: number;
  assignee_id?: number | null;
  due_date?: string | null;
  version: number;
}

export function updateCard(cardId: number, payload: CardUpdatePayload) {
  return apiRequest<Card>(`/cards/${cardId}`, { method: "PATCH", body: payload });
}

export function deleteCard(cardId: number) {
  return apiRequest<void>(`/cards/${cardId}`, { method: "DELETE" });
}

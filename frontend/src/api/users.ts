import { apiRequest } from "./client";
import type { UserPublic } from "../types";

export function searchUsers(query: string) {
  return apiRequest<UserPublic[]>(`/users?search=${encodeURIComponent(query)}`);
}

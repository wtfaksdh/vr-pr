import { apiRequest } from "./client";
import type { User } from "../types";

interface TokenResponse {
  access_token: string;
  token_type: string;
}

export function register(payload: {
  username: string;
  email: string;
  password: string;
  display_name: string;
}) {
  return apiRequest<User>("/auth/register", { method: "POST", body: payload });
}

export function login(payload: { username: string; password: string }) {
  return apiRequest<TokenResponse>("/auth/login", { method: "POST", body: payload });
}

export function getMe() {
  return apiRequest<User>("/auth/me");
}

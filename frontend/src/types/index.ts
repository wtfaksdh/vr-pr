export type BoardRole = "owner" | "writer" | "reader";

export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface UserPublic {
  id: number;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export interface Board {
  id: number;
  title: string;
  description: string | null;
  owner_id: number;
  created_at: string;
  updated_at: string;
  my_role: BoardRole | null;
}

export interface BoardMember {
  id: number;
  user: UserPublic;
  role: BoardRole;
  joined_at: string;
}

export interface Column {
  id: number;
  board_id: number;
  title: string;
  position: number;
  created_at: string;
}

export interface Card {
  id: number;
  column_id: number;
  title: string;
  description: string | null;
  position: number;
  assignee: UserPublic | null;
  author: UserPublic | null;
  due_date: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  card_id: number;
  user: UserPublic;
  text: string;
  created_at: string;
}

/** Обёртка над карточками, сгруппированными по колонке - удобно для рендера доски */
export interface ColumnWithCards extends Column {
  cards: Card[];
}

-- Инициализация схемы БД для Kanban-доски
-- Движок InnoDB обязателен: нужны транзакции и внешние ключи

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(100) NOT NULL,
    avatar_url      VARCHAR(500) NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS boards (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    description     TEXT NULL,
    owner_id        BIGINT NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_boards_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS board_members (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    board_id        BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    role            ENUM('owner', 'writer', 'reader') NOT NULL DEFAULT 'reader',
    joined_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_members_board FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    CONSTRAINT fk_members_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    CONSTRAINT uq_board_user UNIQUE (board_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS columns (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    board_id        BIGINT NOT NULL,
    title           VARCHAR(100) NOT NULL,
    position        INT NOT NULL DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_columns_board FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cards (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    column_id       BIGINT NOT NULL,
    title           VARCHAR(300) NOT NULL,
    description     TEXT NULL,
    position        INT NOT NULL DEFAULT 0,
    assignee_id     BIGINT NULL,
    due_date        DATETIME NULL,
    created_by      BIGINT NULL,
    version         INT NOT NULL DEFAULT 1,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cards_column   FOREIGN KEY (column_id)   REFERENCES columns(id) ON DELETE CASCADE,
    CONSTRAINT fk_cards_assignee FOREIGN KEY (assignee_id) REFERENCES users(id)   ON DELETE SET NULL,
    CONSTRAINT fk_cards_author   FOREIGN KEY (created_by)  REFERENCES users(id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS comments (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    card_id         BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    text            TEXT NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comments_card FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Индексы для частых выборок
CREATE INDEX idx_boards_owner        ON boards(owner_id);
CREATE INDEX idx_members_user        ON board_members(user_id);
CREATE INDEX idx_columns_board       ON columns(board_id);
CREATE INDEX idx_cards_column        ON cards(column_id);
CREATE INDEX idx_cards_assignee      ON cards(assignee_id);
CREATE INDEX idx_comments_card       ON comments(card_id);

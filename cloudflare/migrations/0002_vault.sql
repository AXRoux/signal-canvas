ALTER TABLE users ADD COLUMN password_algo TEXT NOT NULL DEFAULT 'sha256-legacy';

CREATE TABLE IF NOT EXISTS user_vault (
  user_id TEXT PRIMARY KEY NOT NULL,
  vault_cipher TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

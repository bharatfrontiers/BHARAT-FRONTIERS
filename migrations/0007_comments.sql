PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'comment' CHECK(kind IN ('comment','query')),
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_article_status ON comments(article_id,status,created_at);
CREATE INDEX IF NOT EXISTS idx_comments_status_date ON comments(status,created_at);
CREATE INDEX IF NOT EXISTS idx_comments_email_date ON comments(email,created_at);

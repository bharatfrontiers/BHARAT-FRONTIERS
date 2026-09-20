PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  section TEXT NOT NULL,
  type TEXT NOT NULL,
  author TEXT NOT NULL,
  published_at TEXT,
  summary TEXT NOT NULL,
  image TEXT,
  content_html TEXT NOT NULL DEFAULT '',
  more_info_json TEXT NOT NULL DEFAULT '[]',
  source_gate TEXT NOT NULL DEFAULT 'blocked',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','review','approved','published','archived')),
  featured INTEGER NOT NULL DEFAULT 0,
  issue TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  title TEXT NOT NULL,
  publisher TEXT,
  url TEXT NOT NULL,
  published_at TEXT,
  retrieved_at TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'web',
  verified INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS article_evidence (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  paragraph_no INTEGER NOT NULL,
  source_id TEXT NOT NULL,
  claim_excerpt TEXT NOT NULL DEFAULT '',
  FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY(source_id) REFERENCES sources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_articles_status_date ON articles(status,published_at);
CREATE INDEX IF NOT EXISTS idx_articles_section ON articles(section);
CREATE INDEX IF NOT EXISTS idx_sources_article ON sources(article_id);
CREATE INDEX IF NOT EXISTS idx_evidence_article ON article_evidence(article_id);

CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  month_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  cover_image TEXT,
  pdf_url TEXT,
  content_html TEXT NOT NULL DEFAULT '',
  source_count INTEGER NOT NULL DEFAULT 0,
  source_gate TEXT NOT NULL DEFAULT 'blocked',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS issue_articles (
  issue_id TEXT NOT NULL,
  article_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(issue_id, article_id),
  FOREIGN KEY(issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_issue_articles_issue ON issue_articles(issue_id,sort_order);

CREATE TABLE IF NOT EXISTS agent_runs (
  id TEXT PRIMARY KEY,
  issue_id TEXT,
  command TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  message TEXT NOT NULL DEFAULT '',
  FOREIGN KEY(issue_id) REFERENCES issues(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_issue ON agent_runs(issue_id,started_at);

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

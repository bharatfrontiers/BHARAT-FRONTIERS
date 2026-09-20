CREATE TABLE IF NOT EXISTS articles (
 id TEXT PRIMARY KEY,
 slug TEXT NOT NULL UNIQUE,
 title TEXT NOT NULL,
 section TEXT NOT NULL,
 type TEXT NOT NULL,
 author TEXT NOT NULL,
 published_at TEXT,
 summary TEXT NOT NULL,
 image TEXT,
 content_html TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'draft',
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
CREATE INDEX IF NOT EXISTS idx_articles_status_date ON articles(status,published_at);
CREATE INDEX IF NOT EXISTS idx_articles_section ON articles(section);
CREATE INDEX IF NOT EXISTS idx_sources_article ON sources(article_id);

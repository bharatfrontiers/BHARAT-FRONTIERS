ALTER TABLE articles ADD COLUMN subtitle TEXT NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS article_evidence (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  paragraph_no INTEGER NOT NULL,
  source_id TEXT NOT NULL,
  claim_excerpt TEXT NOT NULL DEFAULT '',
  FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY(source_id) REFERENCES sources(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_evidence_article ON article_evidence(article_id);

ALTER TABLE articles ADD COLUMN more_info_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE articles ADD COLUMN source_gate TEXT NOT NULL DEFAULT 'blocked';
ALTER TABLE issues ADD COLUMN content_html TEXT NOT NULL DEFAULT '';
ALTER TABLE issues ADD COLUMN source_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE issues ADD COLUMN source_gate TEXT NOT NULL DEFAULT 'blocked';
CREATE TABLE IF NOT EXISTS agent_runs (
  id TEXT PRIMARY KEY,
  issue_id TEXT,
  command TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  message TEXT NOT NULL DEFAULT ''
);

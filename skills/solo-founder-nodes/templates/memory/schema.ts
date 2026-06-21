// SoloMemory — SQLite/libSQL schema (portable template).
export const MEMORY_SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS memories (
  rowid INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,

  project_id TEXT NOT NULL,
  user_id TEXT,

  phase TEXT NOT NULL,
  kind TEXT NOT NULL,

  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  tags_json TEXT NOT NULL,

  importance REAL NOT NULL DEFAULT 0.5,
  visibility TEXT NOT NULL DEFAULT 'project',
  benchmark_safety TEXT NOT NULL DEFAULT 'safe',

  evidence_refs_json TEXT NOT NULL,
  metadata_json TEXT NOT NULL,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_accessed_at TEXT,
  access_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_memories_project
ON memories(project_id);

CREATE INDEX IF NOT EXISTS idx_memories_project_phase
ON memories(project_id, phase);

CREATE INDEX IF NOT EXISTS idx_memories_project_kind
ON memories(project_id, kind);

CREATE INDEX IF NOT EXISTS idx_memories_safety
ON memories(project_id, benchmark_safety);

CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
  summary,
  content,
  tags,
  content='memories',
  content_rowid='rowid',
  tokenize='unicode61 remove_diacritics 2'
);

CREATE TABLE IF NOT EXISTS memory_vectors (
  memory_id TEXT NOT NULL,
  model TEXT NOT NULL,
  dim INTEGER NOT NULL,
  embedding_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(memory_id, model),
  FOREIGN KEY(memory_id) REFERENCES memories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS memory_events (
  id TEXT PRIMARY KEY,
  memory_id TEXT,
  project_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_memory_events_project
ON memory_events(project_id, created_at);
`;

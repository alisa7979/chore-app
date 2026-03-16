// @ts-ignore — node:sqlite is experimental in Node 22+/24
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const dbPath = path.join(process.cwd(), 'chores.db');
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#4A90D9'
  );

  CREATE TABLE IF NOT EXISTS chores (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    title          TEXT NOT NULL,
    description    TEXT,
    assignee_id    INTEGER REFERENCES members(id) ON DELETE SET NULL,
    recurrence     TEXT NOT NULL DEFAULT 'none',
    recurrence_day INTEGER,
    start_date     TEXT NOT NULL,
    end_date       TEXT
  );

  CREATE TABLE IF NOT EXISTS completions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    chore_id     INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
    due_date     TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    UNIQUE(chore_id, due_date)
  );
`);

export default db;

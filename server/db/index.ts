import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import * as sqliteVec from "sqlite-vec";
import { getConfig } from "../config/env.js";
import { getEmbeddingConfig } from "../config/embedding.js";
import { runMigrations } from "./migrate.js";

let db: Database.Database | null = null;

function ensureDataDir(dbPath: string): void {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function ensureUploadsDir(): void {
  const uploads = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploads)) {
    fs.mkdirSync(uploads, { recursive: true });
  }
}

function getDb(): Database.Database {
  if (db) return db;
  const config = getConfig();
  ensureDataDir(config.DATABASE_PATH);
  ensureUploadsDir();
  db = new Database(config.DATABASE_PATH);

  sqliteVec.load(db);

  const emb = getEmbeddingConfig();
  if (emb.rembedExtensionPath) {
    db.loadExtension(emb.rembedExtensionPath);
    db.prepare(
      `INSERT OR REPLACE INTO temp.rembed_clients(name, options) VALUES (?, rembed_client_options('format', 'openai', 'url', ?, 'key', ?))`
    ).run(emb.model, emb.baseURL, emb.apiKey ?? "");
  }

  runMigrations(db);

  const userCount = db.prepare('SELECT COUNT(*) as c FROM "users"').get() as { c: number };
  if (userCount.c === 0) {
    const defaultId = config.DEFAULT_USER_ID ?? crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO "users" ("id", "email", "name", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?)`
    ).run(defaultId, "default@local.dev", "Default User", now, now);
  }

  return db;
}

export function getDatabase(): Database.Database {
  return getDb();
}

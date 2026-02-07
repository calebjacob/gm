import type Database from "better-sqlite3";
import { getDatabase } from "../db/index.js";
import { getEmbeddingConfig } from "../config/embedding.js";
import type { Chunk } from "./chunk.js";

export function ingestRulesetChunks(
  rulesetId: string,
  chunks: Chunk[],
  rulesetSourceId: string | null,
  db?: Database.Database
): void {
  const database = db ?? getDatabase();
  const emb = getEmbeddingConfig();
  const now = new Date().toISOString();
  const insertChunk = database.prepare(`
    INSERT INTO "rulesetChunks" ("rulesetId", "rulesetSourceId", "content", "sectionLabel", "createdAt")
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertVec = database.prepare(`
    INSERT INTO "vecRulesetChunks" (rowid, embedding, rulesetId)
    VALUES (?, rembed(?, ?), ?)
  `);
  for (const ch of chunks) {
    const r = insertChunk.run(rulesetId, rulesetSourceId, ch.content, ch.sectionLabel ?? null, now);
    const rowid = (r as { lastInsertRowid: number }).lastInsertRowid;
    if (emb.rembedExtensionPath) {
      insertVec.run(rowid, emb.model, ch.content, rulesetId);
    }
  }
}

export function ingestWorldChunks(
  worldId: string,
  chunks: Chunk[],
  worldSourceId: string | null,
  db?: Database.Database
): void {
  const database = db ?? getDatabase();
  const emb = getEmbeddingConfig();
  const now = new Date().toISOString();
  const insertChunk = database.prepare(`
    INSERT INTO "worldChunks" ("worldId", "worldSourceId", "content", "sectionLabel", "createdAt")
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertVec = database.prepare(`
    INSERT INTO "vecWorldChunks" (rowid, embedding, worldId)
    VALUES (?, rembed(?, ?), ?)
  `);
  for (const ch of chunks) {
    const r = insertChunk.run(worldId, worldSourceId, ch.content, ch.sectionLabel ?? null, now);
    const rowid = (r as { lastInsertRowid: number }).lastInsertRowid;
    if (emb.rembedExtensionPath) {
      insertVec.run(rowid, emb.model, ch.content, worldId);
    }
  }
}

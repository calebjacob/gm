import type Database from "better-sqlite3";
import { getDatabase } from "../db/index.js";
import { getEmbeddingConfig } from "../config/embedding.js";

export function retrieve(
  queryText: string,
  rulesetId: string,
  worldId: string,
  k: number = 5,
  db?: Database.Database
): { rulesContext: string; campaignContext: string } {
  const database = db ?? getDatabase();
  const emb = getEmbeddingConfig();
  if (!emb.rembedExtensionPath) {
    return { rulesContext: "", campaignContext: "" };
  }
  const embedStmt = database.prepare(
    `SELECT rembed(?, ?) as blob`
  );
  const embedRow = embedStmt.get(emb.model, queryText) as { blob: Buffer } | undefined;
  if (!embedRow?.blob) {
    return { rulesContext: "", campaignContext: "" };
  }
  const rulesStmt = database.prepare(`
    SELECT c."content", c."sectionLabel"
    FROM vecRulesetChunks v
    JOIN rulesetChunks c ON c.id = v.rowid
    WHERE v.embedding MATCH ? AND v.rulesetId = ? AND k = ?
    ORDER BY v.distance
  `);
  const worldStmt = database.prepare(`
    SELECT c."content", c."sectionLabel"
    FROM vecWorldChunks v
    JOIN worldChunks c ON c.id = v.rowid
    WHERE v.embedding MATCH ? AND v.worldId = ? AND k = ?
    ORDER BY v.distance
  `);
  const rulesRows = rulesStmt.all(embedRow.blob, rulesetId, k) as { content: string; sectionLabel: string | null }[];
  const worldRows = worldStmt.all(embedRow.blob, worldId, k) as { content: string; sectionLabel: string | null }[];
  const rulesContext = rulesRows.map((r) => r.content).join("\n\n");
  const campaignContext = worldRows.map((r) => r.content).join("\n\n");
  return { rulesContext, campaignContext };
}

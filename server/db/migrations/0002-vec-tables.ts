import type Database from "better-sqlite3";
import { getEmbeddingConfig } from "../../config/embedding.js";

export const version = 2;

export function up(db: Database.Database): void {
  const { dimension } = getEmbeddingConfig();
  db.exec(`
    CREATE VIRTUAL TABLE "vecRulesetChunks" USING vec0(
      rowid INTEGER PRIMARY KEY,
      embedding FLOAT[${dimension}],
      rulesetId TEXT
    );
    CREATE VIRTUAL TABLE "vecWorldChunks" USING vec0(
      rowid INTEGER PRIMARY KEY,
      embedding FLOAT[${dimension}],
      worldId TEXT
    );
  `);
}

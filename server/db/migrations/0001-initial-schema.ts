import type Database from "better-sqlite3";

export const version = 1;

export function up(db: Database.Database): void {
  db.exec(`
    CREATE TABLE "users" (
      "id" TEXT PRIMARY KEY,
      "email" TEXT,
      "name" TEXT,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL
    );

    CREATE TABLE "rulesets" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "users"("id"),
      "name" TEXT NOT NULL,
      "description" TEXT,
      "coverImagePath" TEXT,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL
    );

    CREATE TABLE "rulesetSources" (
      "id" TEXT PRIMARY KEY,
      "rulesetId" TEXT NOT NULL REFERENCES "rulesets"("id"),
      "filePath" TEXT NOT NULL,
      "originalFileName" TEXT NOT NULL,
      "sortOrder" INTEGER,
      "createdAt" TEXT NOT NULL
    );

    CREATE TABLE "worlds" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "users"("id"),
      "name" TEXT NOT NULL,
      "description" TEXT,
      "coverImagePath" TEXT,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL
    );

    CREATE TABLE "worldSources" (
      "id" TEXT PRIMARY KEY,
      "worldId" TEXT NOT NULL REFERENCES "worlds"("id"),
      "filePath" TEXT NOT NULL,
      "originalFileName" TEXT NOT NULL,
      "sortOrder" INTEGER,
      "createdAt" TEXT NOT NULL
    );

    CREATE TABLE "campaigns" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "users"("id"),
      "rulesetId" TEXT NOT NULL REFERENCES "rulesets"("id"),
      "worldId" TEXT NOT NULL REFERENCES "worlds"("id"),
      "name" TEXT NOT NULL,
      "coverImagePath" TEXT,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL
    );

    CREATE TABLE "characters" (
      "id" TEXT PRIMARY KEY,
      "campaignId" TEXT NOT NULL REFERENCES "campaigns"("id"),
      "name" TEXT NOT NULL,
      "race" TEXT,
      "className" TEXT,
      "description" TEXT,
      "imagePath" TEXT,
      "skills" TEXT,
      "statistics" TEXT,
      "items" TEXT,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL
    );

    CREATE TABLE "campaignMessages" (
      "id" TEXT PRIMARY KEY,
      "campaignId" TEXT NOT NULL REFERENCES "campaigns"("id"),
      "role" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL
    );

    CREATE TABLE "rulesetChunks" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "rulesetId" TEXT NOT NULL REFERENCES "rulesets"("id"),
      "rulesetSourceId" TEXT REFERENCES "rulesetSources"("id"),
      "content" TEXT NOT NULL,
      "sectionLabel" TEXT,
      "createdAt" TEXT NOT NULL
    );

    CREATE TABLE "worldChunks" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "worldId" TEXT NOT NULL REFERENCES "worlds"("id"),
      "worldSourceId" TEXT REFERENCES "worldSources"("id"),
      "content" TEXT NOT NULL,
      "sectionLabel" TEXT,
      "createdAt" TEXT NOT NULL
    );

    CREATE INDEX "idx_rulesets_userId" ON "rulesets"("userId");
    CREATE INDEX "idx_worlds_userId" ON "worlds"("userId");
    CREATE INDEX "idx_campaigns_userId" ON "campaigns"("userId");
    CREATE INDEX "idx_campaigns_rulesetId" ON "campaigns"("rulesetId");
    CREATE INDEX "idx_campaigns_worldId" ON "campaigns"("worldId");
    CREATE INDEX "idx_characters_campaignId" ON "characters"("campaignId");
    CREATE INDEX "idx_campaignMessages_campaignId" ON "campaignMessages"("campaignId");
    CREATE INDEX "idx_rulesetChunks_rulesetId" ON "rulesetChunks"("rulesetId");
    CREATE INDEX "idx_worldChunks_worldId" ON "worldChunks"("worldId");
  `);
}

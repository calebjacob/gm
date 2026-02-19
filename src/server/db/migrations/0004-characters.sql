CREATE TABLE "characters" (
  "id" TEXT PRIMARY KEY,
  "campaignId" TEXT NOT NULL,
  FOREIGN KEY ("campaignId") REFERENCES "campaigns" ("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "imagePath" TEXT,
  "ruleset" TEXT NOT NULL,
  "details" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE INDEX "indexCharactersCampaignId" ON "characters" ("campaignId");

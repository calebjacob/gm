CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT,
  "name" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE "modules" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "coverImagePath" TEXT,
  "contentFilePath" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE INDEX "indexModulesUserId" ON "modules" ("userId");

CREATE TABLE "campaigns" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "ruleset" TEXT NOT NULL,
  "description" TEXT,
  "coverImagePath" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE INDEX "indexCampaignsUserId" ON "campaigns" ("userId");

CREATE TABLE "campaignsModules" (
  "id" TEXT PRIMARY KEY,
  "campaignId" TEXT NOT NULL REFERENCES "campaigns" ("id") ON DELETE CASCADE,
  "moduleId" TEXT NOT NULL REFERENCES "modules" ("id") ON DELETE CASCADE
);

CREATE INDEX "indexCampaignsModulesCampaignId" ON "campaignsModules" (
  "campaignId"
);
CREATE INDEX "indexCampaignsModulesModuleId" ON "campaignsModules" ("moduleId");

CREATE TABLE "campaignMessages" (
  "id" TEXT PRIMARY KEY,
  "campaignId" TEXT NOT NULL REFERENCES "campaigns" ("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE INDEX "indexCampaignMessagesCampaignId" ON "campaignMessages" (
  "campaignId"
);

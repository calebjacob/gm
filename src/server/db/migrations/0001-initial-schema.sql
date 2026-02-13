CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT,
  "name" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE "modules" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users" ("id"),
  "category" TEXT NOT NULL,
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
  "userId" TEXT NOT NULL REFERENCES "users" ("id"),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "coverImagePath" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE INDEX "indexCampaignsUserId" ON "campaigns" ("userId");

CREATE TABLE "campaignsModules" (
  "id" TEXT PRIMARY KEY,
  "campaignId" TEXT NOT NULL REFERENCES "campaigns" ("id"),
  "moduleId" TEXT NOT NULL REFERENCES "modules" ("id")
);

CREATE INDEX "indexCampaignsModulesCampaignId" ON "campaignsModules" (
  "campaignId"
);
CREATE INDEX "indexCampaignsModulesModuleId" ON "campaignsModules" ("moduleId");

CREATE TABLE "characters" (
  "id" TEXT PRIMARY KEY,
  "campaignId" TEXT NOT NULL REFERENCES "campaigns" ("id"),
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

CREATE INDEX "indexCharactersCampaignId" ON "characters" ("campaignId");

CREATE TABLE "campaignMessages" (
  "id" TEXT PRIMARY KEY,
  "campaignId" TEXT NOT NULL REFERENCES "campaigns" ("id"),
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE INDEX "indexCampaignMessagesCampaignId" ON "campaignMessages" (
  "campaignId"
);

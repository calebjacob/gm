CREATE TABLE "moduleChunks" (
  "id" TEXT PRIMARY KEY,
  "moduleId" TEXT NOT NULL REFERENCES "modules" ("id"),
  "category" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "contentFilePath" TEXT NOT NULL,
  "embedding" F32_BLOB(0)
);

CREATE INDEX "indexModuleChunksModuleId" ON "moduleChunks" ("moduleId");

CREATE INDEX "indexModuleChunksEmbedding" ON "moduleChunks" (
  libsql_vector_idx("embedding")
);

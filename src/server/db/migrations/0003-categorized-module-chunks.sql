CREATE TABLE "categorizedModuleChunks" (
  "id" TEXT PRIMARY KEY,
  "moduleId" TEXT NOT NULL,
  FOREIGN KEY ("moduleId") REFERENCES "modules" ("id") ON DELETE CASCADE,
  "moduleChunkId" TEXT NOT NULL,
  FOREIGN KEY ("moduleChunkId") REFERENCES "moduleChunks" ("id") ON DELETE CASCADE,
  "category" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "embedding" F32_BLOB(0)
);

CREATE INDEX "indexCategorizedModuleChunksModuleId" ON "categorizedModuleChunks" (
  "moduleId"
);

CREATE INDEX "indexCategorizedModuleChunksModuleChunkId" ON "categorizedModuleChunks" (
  "moduleChunkId"
);

CREATE INDEX "indexCategorizedModuleChunksEmbedding" ON "categorizedModuleChunks" (
  libsql_vector_idx("embedding")
);

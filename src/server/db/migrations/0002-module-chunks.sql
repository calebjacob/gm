CREATE TABLE "moduleChunks" (
  "id" TEXT PRIMARY KEY,
  "moduleId" TEXT NOT NULL REFERENCES "modules" ("id"),
  "content" TEXT NOT NULL,
  "chunkIndex" INTEGER NOT NULL,
  "pageNumber" INTEGER NOT NULL,
  "offsetStart" INTEGER NOT NULL,
  "offsetEnd" INTEGER NOT NULL,
  "embedding" F32_BLOB(0)
);

CREATE INDEX "indexModuleChunksModuleId" ON "moduleChunks" ("moduleId");

CREATE INDEX "indexModuleChunksEmbedding" ON "moduleChunks" (
  libsql_vector_idx("embedding")
);

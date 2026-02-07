# GM

*...official name TBD*

The ultimate game master powered by AI running locally on your computer. Your adventures (data) are yours alone.

## Run

1. Copy `.env.example` to `.env` and set at least: `DATABASE_PATH`, `LLM_BASE_URL`, `LLM_MODEL`, and the embedding variables (`EMBEDDING_MODEL`, `EMBEDDING_BASE_URL`, `EMBEDDING_API_KEY` if required, `EMBEDDING_DIMENSION`).
2. Migrations run on app start; ensure the database directory exists (e.g. `./data` for `./data/gm.sqlite`).
3. Run `pnpm dev`.
4. If using local embeddings (LM Studio or Ollama), ensure the service is running and serving an embedding model at the configured `EMBEDDING_BASE_URL`.

import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_PATH: z.string().default("./data/gm.sqlite"),
  REMBED_EXTENSION_PATH: z.string().optional(),

  // LLM (GM)
  LLM_BASE_URL: z.string().url().default("http://localhost:1234/v1"),
  LLM_MODEL: z.string().default("llama3.2"),
  LLM_API_KEY: z.string().optional().default(""),

  // Embeddings (sqlite-rembed)
  EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  EMBEDDING_BASE_URL: z.string().url().default("http://localhost:1234/v1"),
  EMBEDDING_API_KEY: z.string().optional().default(""),
  EMBEDDING_DIMENSION: z.coerce.number().int().positive().default(1536),

  // Optional: dev default user when no auth
  DEFAULT_USER_ID: z.string().uuid().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

function getEnv(): Env {
  if (cached) return cached;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const message = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    throw new Error(`Invalid environment: ${message}`);
  }
  cached = result.data;
  return cached;
}

export function getConfig(): Env {
  return getEnv();
}

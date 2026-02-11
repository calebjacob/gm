import { z } from "zod";

const serverEnvSchema = z.object({
	DATABASE_PATH: z.string(),
	DEFAULT_USER_EMAIL: z.string(),
	DEFAULT_USER_NAME: z.string(),
	DEFAULT_USER_ID: z.string(),
	EMBEDDING_API_KEY: z.string().optional(),
	EMBEDDING_BASE_URL: z.string(),
	EMBEDDING_DIMENSION: z.string(),
	EMBEDDING_MODEL: z.string(),
	LLM_API_KEY: z.string().optional(),
	LLM_BASE_URL: z.string(),
	LLM_MODEL: z.string(),
	UPLOADS_PATH: z.string(),
});

export const serverEnv = serverEnvSchema.parse(process.env);

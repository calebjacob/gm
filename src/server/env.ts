import { z } from "zod";

const serverEnvSchema = z.object({
	DATABASE_PATH: z.string(),
	DEFAULT_USER_EMAIL: z.string(),
	DEFAULT_USER_NAME: z.string(),
	DEFAULT_USER_ID: z.string(),
	GOOGLE_AI_API_KEY: z.string(),
	GOOGLE_LLM_MODEL: z.string(),
	GOOGLE_EMBEDDING_MODEL: z.string(),
	GOOGLE_EMBEDDING_DIMENSION: z.coerce.number(),
	UPLOADS_PATH: z.string(),
});

export const serverEnv = serverEnvSchema.parse(process.env);

import { z } from "zod";

export const moduleChunkSchema = z.object({
	id: z.string(),
	moduleId: z.string(),
	content: z.string(),
	chunkIndex: z.number(),
	pageNumber: z.number(),
	embedding: z.array(z.number()).optional(),
});

export type ModuleChunkSchema = z.infer<typeof moduleChunkSchema>;

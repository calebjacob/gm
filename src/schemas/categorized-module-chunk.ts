import { z } from "zod";

export const categorizedModuleChunkCategorySchema = z.enum([
	"ability",
	"character",
	"class",
	"item",
	"location",
	"lore",
	"other",
	"quest",
	"rule",
	"species",
]);

export type CategorizedModuleChunkCategorySchema = z.infer<
	typeof categorizedModuleChunkCategorySchema
>;

export const categorizedModuleChunkSchema = z.object({
	id: z.string(),
	moduleId: z.string(),
	moduleChunkId: z.string(),
	category: categorizedModuleChunkCategorySchema,
	name: z.string(),
	content: z.string(),
	embedding: z.array(z.number()).optional(),
});

export type CategorizedModuleChunkSchema = z.infer<
	typeof categorizedModuleChunkSchema
>;

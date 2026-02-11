import { z } from "zod";

export const moduleChunkCategorySchema = z.enum(["rules", "world-building"]);
export type ModuleChunkCategory = z.infer<typeof moduleChunkCategorySchema>;

export function toModuleChunkCategory(
	category: string | undefined | null,
): ModuleChunkCategory {
	if (category === "world-building") {
		return "world-building";
	}
	return "rules";
}

import { z } from "zod";
import { isoDateTime } from "./date-time";

export const moduleCategorySchema = z.enum(["rules", "world-building"]);
export type ModuleCategorySchema = z.infer<typeof moduleCategorySchema>;

export function toModuleCategory(
	category: string | undefined | null,
): ModuleCategorySchema {
	if (category === "world-building") {
		return "world-building";
	}
	return "rules";
}

export const moduleSchema = z.object({
	id: z.string(),
	userId: z.string(),
	category: moduleCategorySchema,
	name: z.string(),
	description: z.string().nullish(),
	coverImagePath: z.string().nullish(),
	contentFilePath: z.string(),
	createdAt: isoDateTime,
	updatedAt: isoDateTime,
});

export type ModuleSchema = z.infer<typeof moduleSchema>;

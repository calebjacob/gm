import { z } from "zod";
import { isoDateTime } from "./date-time";

export const characterSchema = z.object({
	id: z.string(),
	campaignId: z.string(),
	abilities: z.string().nullish(),
	class: z.string().nullish(),
	description: z.string().nullish(),
	equipment: z.string().nullish(),
	imagePath: z.string().nullish(),
	inventory: z.string().nullish(),
	name: z.string(),
	species: z.string().nullish(),
	statistics: z.string().nullish(),
	statuses: z.string().nullish(),
	createdAt: isoDateTime,
	updatedAt: isoDateTime,
});

export type CharacterSchema = z.infer<typeof characterSchema>;

import { z } from "zod";
import { isoDateTime } from "./date-time";

export const campaignSchema = z.object({
	id: z.string(),
	userId: z.string(),
	name: z.string(),
	description: z.string().nullish(),
	coverImagePath: z.string().nullish(),
	createdAt: isoDateTime,
	updatedAt: isoDateTime,
});

export type CampaignSchema = z.infer<typeof campaignSchema>;

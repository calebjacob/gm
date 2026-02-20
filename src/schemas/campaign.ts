import { z } from "zod";
import { isoDateTime } from "./date-time";
import { rulesetSchema } from "./ruleset";

export const campaignStatusSchema = z.enum(["draft", "active", "completed"]);

export const campaignSchema = z.object({
	id: z.string(),
	userId: z.string(),
	ruleset: rulesetSchema,
	status: campaignStatusSchema,
	name: z.string(),
	description: z.string().nullish(),
	coverImagePath: z.string().nullish(),
	createdAt: isoDateTime,
	updatedAt: isoDateTime,
});

export type CampaignSchema = z.infer<typeof campaignSchema>;

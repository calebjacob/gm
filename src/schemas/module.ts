import { z } from "zod";
import { isoDateTime } from "./date-time";

export const moduleSchema = z.object({
	id: z.string(),
	userId: z.string(),
	name: z.string(),
	description: z.string().nullish(),
	coverImagePath: z.string().nullish(),
	contentFilePath: z.string(),
	createdAt: isoDateTime,
	updatedAt: isoDateTime,
});

export type ModuleSchema = z.infer<typeof moduleSchema>;

export const campaignsModulesSchema = z.object({
	id: z.string(),
	campaignId: z.string(),
	moduleId: z.string(),
});

export type CampaignsModulesSchema = z.infer<typeof campaignsModulesSchema>;

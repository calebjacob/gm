import { z } from "zod";

export const rulesetSchema = z.enum(["dnd-5e"]);
export type RulesetSchema = z.infer<typeof rulesetSchema>;

export const rulesetDetails: Record<
	RulesetSchema,
	{
		name: string;
	}
> = {
	"dnd-5e": {
		name: "D&D 5th Edition",
	},
};

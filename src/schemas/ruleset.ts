import { z } from "zod";

export const rulesetSchema = z.enum(["dnd-5e"]);
export type RulesetSchema = z.infer<typeof rulesetSchema>;

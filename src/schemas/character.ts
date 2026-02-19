import { z } from "zod";
import { isoDateTime } from "./date-time";
import { rulesetSchema } from "./ruleset";

export const characterDetailsSchema = z.discriminatedUnion("ruleset", [
	z.object({
		ruleset: z.literal(rulesetSchema.enum["dnd-5e"]),
		class: z.object({
			name: z.string(),
			level: z.number().min(1).max(20),
			multi: z
				.array(
					z.object({
						name: z.string(),
						level: z.number().min(1).max(20),
					}),
				)
				.optional(),
		}),
		species: z.array(z.string()).min(1),
		description: z.string(),
		experiencePoints: z.number().min(0),
		hitPoints: {
			current: z.number(),
			max: z.number(),
		},
		items: z.array(
			z.object({
				name: z.string(),
				equipped: z.boolean(),
				description: z.string(),
				quantity: z.number(),
				weight: z.number(),
				value: z.number(),
			}),
		),
		abilities: z.object({
			strength: z.number(),
			dexterity: z.number(),
			constitution: z.number(),
			intelligence: z.number(),
			wisdom: z.number(),
			charisma: z.number(),
		}),
		statuses: z.array(z.string()),
	}),
]);

export const characterSchema = z.object({
	id: z.string(),
	campaignId: z.string(),
	imagePath: z.string().nullish(),
	name: z.string(),
	details: z
		.preprocess(
			(value) => (typeof value === "string" ? JSON.parse(value) : value),
			z.record(z.string(), z.any()),
		)
		.pipe(characterDetailsSchema),
	createdAt: isoDateTime,
	updatedAt: isoDateTime,
});

export type CharacterSchema = z.infer<typeof characterSchema>;

export function toDerivedCharacterDetails(details: CharacterSchema) {
	switch (details.details.ruleset) {
		case rulesetSchema.enum["dnd-5e"]: {
			const totalLevel =
				details.details.class.multi?.reduce(
					(acc, curr) => acc + curr.level,
					details.details.class.level,
				) ?? details.details.class.level;

			let proficiencyBonus = 2;
			if (totalLevel > 4) proficiencyBonus++;
			if (totalLevel > 8) proficiencyBonus++;
			if (totalLevel > 12) proficiencyBonus++;
			if (totalLevel > 16) proficiencyBonus++;

			return {
				proficiencyBonus,
				totalLevel,
			};
		}

		default: {
			throw new Error(`Unsupported ruleset: ${details.details.ruleset}`);
		}
	}
}

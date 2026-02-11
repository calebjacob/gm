import { createServerOnlyFn } from "@tanstack/react-start";
import { z } from "zod";
import { moduleCategorySchema } from "@/schemas/module";
import { getEmbeddingModel } from "../ai/models";
import { getDb } from "../db/index";

export const retrieve = createServerOnlyFn(
	async ({
		query,
		campaignId,
		limit = 5,
	}: {
		query: string;
		campaignId: string;
		limit?: number;
	}) => {
		const db = getDb();
		const embeddingModel = getEmbeddingModel();
		const queryEmbedding = await embeddingModel.embedQuery(query);

		const vectorQuery = await db.execute({
			sql: `
          WITH vector_scores AS (
            SELECT DISTINCT
              "id",
              "content",
              "category",
              1 - vector_distance_cos(embedding, vector32($embedding)) AS "relevance"
            FROM "moduleChunks"
            WHERE "moduleId" = $campaignId
            ORDER BY "relevance" DESC
            LIMIT $limit
          )
          SELECT "id", "content", "category", "relevance" FROM "vector_scores"
        `,
			args: {
				embedding: JSON.stringify(queryEmbedding),
				campaignId,
				limit,
			},
		});

		const results = z
			.array(
				z.object({
					id: z.string(),
					content: z.string(),
					category: moduleCategorySchema,
					relevance: z.number(),
				}),
			)
			.parse(vectorQuery.rows);

		let rulesContext = "";
		let worldBuildingContext = "";

		for (const result of results) {
			if (result.category === "rules") {
				rulesContext += result.content + "\n";
			} else if (result.category === "world-building") {
				worldBuildingContext += result.content + "\n";
			}
		}

		return { rulesContext, worldBuildingContext };
	},
);

import { createServerOnlyFn } from "@tanstack/react-start";
import { z } from "zod";
import { campaignSchema } from "@/schemas/campaign";
import { moduleSchema } from "@/schemas/module";
import { moduleChunkSchema } from "@/schemas/module-chunk";
import { getEmbeddingModel } from "../ai/models";
import { getCurrentUserId } from "../auth";
import { getDb } from "../db/index";

export const retrieve = createServerOnlyFn(
	async ({
		query,
		campaignId,
		limit = 3,
	}: {
		query: string;
		campaignId: string;
		limit?: number;
	}) => {
		const db = getDb();
		const embeddingModel = getEmbeddingModel();
		const queryEmbedding = await embeddingModel.embedQuery(query);

		const campaignQuery = await db.execute({
			sql: `
				SELECT *
				FROM "campaigns"
				WHERE "id" = $campaignId
					AND "userId" = $userId
			`,
			args: {
				campaignId,
				userId: getCurrentUserId(),
			},
		});

		const campaign = campaignSchema.parse(campaignQuery.rows[0]);

		const modulesQuery = await db.execute({
			sql: `
				SELECT *
				FROM "modules" AS m
				INNER JOIN "campaignsModules" AS cm ON m."id" = cm."moduleId"
				WHERE cm."campaignId" = $campaignId
			`,
			args: {
				campaignId,
			},
		});

		const modules = moduleSchema.array().parse(modulesQuery.rows);

		const moduleChunksQuery = await db.execute({
			sql: `
				WITH vector_scores AS (
					SELECT
						"id",
						"content",
						"chunkIndex",
						"pageNumber",
						"moduleId",
						1 - vector_distance_cos(embedding, vector32($embedding)) AS "relevance"
					FROM "moduleChunks"
					WHERE "moduleId" IN (${modules.map((_, i) => `$moduleId${i}`).join(", ")})
					ORDER BY "relevance" DESC
					LIMIT $limit
				)
				SELECT "id", "content", "moduleId", "chunkIndex", "pageNumber", "relevance" FROM "vector_scores"
			`,
			args: {
				embedding: JSON.stringify(queryEmbedding),
				limit,
				...Object.fromEntries(
					modules.map((module, i) => [`moduleId${i}`, module.id]),
				),
			},
		});

		const moduleChunks = z
			.array(
				moduleChunkSchema.extend({
					relevance: z.number(),
				}),
			)
			.parse(moduleChunksQuery.rows);

		const moduleForChunk = (moduleChunkId: string) => {
			const module = modules.find((module) => module.id === moduleChunkId);
			if (!module) {
				throw new Error(`Module not found for chunk ${moduleChunkId}`);
			}
			return module;
		};

		const result = {
			campaign,
			moduleChunks: moduleChunks.map((chunk) => ({
				...chunk,
				module: moduleForChunk(chunk.moduleId),
			})),
		};

		return result;
	},
);

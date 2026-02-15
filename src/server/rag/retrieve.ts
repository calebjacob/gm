import { createServerOnlyFn } from "@tanstack/react-start";
import { z } from "zod";
import { type CampaignSchema, campaignSchema } from "@/schemas/campaign";
import { moduleSchema } from "@/schemas/module";
import { moduleChunkSchema } from "@/schemas/module-chunk";
import { getEmbeddingModel } from "../ai/models";
import { getCurrentUserId } from "../auth";
import { getDb } from "../db/index";

export const relevantModuleChunkSchema = moduleChunkSchema.extend({
	module: moduleSchema,
	relevance: z.number(),
});

export type RelevantModuleChunkSchema = z.infer<
	typeof relevantModuleChunkSchema
>;

export const findRelevantModuleChunksServer = createServerOnlyFn(
	async ({
		query,
		campaignId,
		limit,
	}: {
		query: string;
		campaignId: string;
		limit: number;
	}): Promise<{
		campaign: CampaignSchema;
		moduleChunks: RelevantModuleChunkSchema[];
	}> => {
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
						"offsetStart",
						"offsetEnd",
						"moduleId",
						1 - vector_distance_cos(embedding, vector32($embedding)) AS "relevance"
					FROM "moduleChunks"
					WHERE "moduleId" IN (${modules.map((_, i) => `$moduleId${i}`).join(", ")})
					ORDER BY "relevance" DESC
					LIMIT $limit
				)
				SELECT "id", "content", "moduleId", "chunkIndex", "pageNumber", "offsetStart", "offsetEnd", "relevance" FROM "vector_scores"
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
			.array(relevantModuleChunkSchema.omit({ module: true }))
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

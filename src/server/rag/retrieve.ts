import { createServerOnlyFn } from "@tanstack/react-start";
import { z } from "zod";
import { type CampaignSchema, campaignSchema } from "@/schemas/campaign";
import { categorizedModuleChunkSchema } from "@/schemas/categorized-module-chunk";
import { moduleSchema } from "@/schemas/module";
import { moduleChunkSchema } from "@/schemas/module-chunk";
import { embedContentServer } from "../ai";
import { getCurrentUserId } from "../auth";
import { db } from "../db";

export const relevantModuleChunkSchema = moduleChunkSchema.extend({
	module: moduleSchema,
	relevance: z.number(),
});

export type RelevantModuleChunkSchema = z.infer<
	typeof relevantModuleChunkSchema
>;

export const relevantCategorizedModuleChunkSchema =
	categorizedModuleChunkSchema.extend({
		module: moduleSchema,
		moduleChunk: moduleChunkSchema,
		relevance: z.number(),
	});

export type RelevantCategorizedModuleChunkSchema = z.infer<
	typeof relevantCategorizedModuleChunkSchema
>;

export const findRelevantModuleChunksServer = createServerOnlyFn(
	async ({
		query,
		campaignId,
		limit,
		relevanceThreshold,
	}: {
		query: string;
		campaignId: string;
		limit: number;
		relevanceThreshold: number;
	}): Promise<{
		campaign: CampaignSchema;
		categorizedModuleChunks: RelevantCategorizedModuleChunkSchema[];
		moduleChunks: RelevantModuleChunkSchema[];
	}> => {
		const { embedding: queryEmbedding } = await embedContentServer(query);

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
						"embedding",
						1 - vector_distance_cos(embedding, vector32($embedding)) AS "relevance"
					FROM "moduleChunks"
					WHERE "moduleId" IN (${modules.map((_, i) => `$moduleId${i}`).join(", ")})
					 AND "relevance" > $relevanceThreshold
					ORDER BY "relevance" DESC
					LIMIT $limit
				)
				SELECT "id", "content", "moduleId", "chunkIndex", "pageNumber", "offsetStart", "offsetEnd", "embedding", "relevance" FROM "vector_scores"
			`,
			args: {
				embedding: JSON.stringify(queryEmbedding),
				limit,
				...Object.fromEntries(
					modules.map((module, i) => [`moduleId${i}`, module.id]),
				),
				relevanceThreshold,
			},
		});

		const moduleChunks = z
			.array(
				relevantModuleChunkSchema
					.omit({ module: true, embedding: true })
					.extend({ embedding: z.any() }),
			)
			.parse(moduleChunksQuery.rows);

		const categorizedModuleChunksQuery = await db.execute({
			sql: `
					WITH vector_scores AS (
						SELECT
							"id",
							"moduleId",
							"moduleChunkId",
							"category",
							"name",
							"content",
							"embedding",
							1 - vector_distance_cos(embedding, vector32($embedding)) AS "relevance"
						FROM "categorizedModuleChunks"
						WHERE "moduleId" IN (${modules.map((_, i) => `$moduleId${i}`).join(", ")})
						 AND "relevance" > $relevanceThreshold
						ORDER BY "relevance" DESC
						LIMIT $limit
					)
					SELECT "id", "moduleId", "moduleChunkId", "category", "name", "content", "embedding", "relevance" FROM "vector_scores"
				`,
			args: {
				embedding: JSON.stringify(queryEmbedding),
				limit,
				...Object.fromEntries(
					modules.map((module, i) => [`moduleId${i}`, module.id]),
				),
				relevanceThreshold,
			},
		});

		const categorizedModuleChunks = z
			.array(
				relevantCategorizedModuleChunkSchema
					.omit({ module: true, moduleChunk: true, embedding: true })
					.extend({ embedding: z.any() }),
			)
			.parse(categorizedModuleChunksQuery.rows);

		const moduleForChunk = (moduleChunkId: string) => {
			const module = modules.find((module) => module.id === moduleChunkId);
			if (!module) {
				throw new Error(`Module not found for moduleChunkId: ${moduleChunkId}`);
			}
			return module;
		};

		const moduleChunkForCategorizedChunk = (moduleChunkId: string) => {
			const moduleChunk = moduleChunks.find(
				(chunk) => chunk.id === moduleChunkId,
			);
			if (!moduleChunk) {
				throw new Error(
					`Module chunk not found for categorized chunk with moduleChunkId: ${moduleChunkId}`,
				);
			}
			return moduleChunk;
		};

		const result = {
			campaign,
			categorizedModuleChunks: categorizedModuleChunks.map((chunk) => ({
				...chunk,
				module: moduleForChunk(chunk.moduleId),
				moduleChunk: moduleChunkForCategorizedChunk(chunk.moduleChunkId),
			})),
			moduleChunks: moduleChunks.map((chunk) => ({
				...chunk,
				module: moduleForChunk(chunk.moduleId),
			})),
		};

		return result;
	},
);

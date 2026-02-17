import { useQuery } from "@tanstack/react-query";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { PencilRulerIcon } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Badge } from "@/components/lib/Badge";
import { Card } from "@/components/lib/Card";
import { FileSelect } from "@/components/lib/FileSelect";
import { Progress } from "@/components/lib/Progress";
import { Row } from "@/components/lib/Row";
import { Stack } from "@/components/lib/Stack";
import { Text } from "@/components/lib/Text";
import { ThumbnailImage } from "@/components/lib/ThumbnailImage";
import {
	type CategorizedModuleChunkSchema,
	categorizedModuleChunkCategorySchema,
} from "@/schemas/categorized-module-chunk";
import { type ModuleSchema, moduleSchema } from "@/schemas/module";
import {
	type ModuleChunkSchema,
	moduleChunkSchema,
} from "@/schemas/module-chunk";
import {
	embedContentServer,
	generateStructuredContentServer,
} from "@/server/ai";
import { MODULE_INGESTION_PROMPT } from "@/server/ai/prompts/module-ingestion";
import { getCurrentUserId } from "@/server/auth";
import { db } from "@/server/db";
import { readTextFileServer } from "@/server/files/read";
import { uploadFileServer } from "@/server/files/upload";
import { handleClientError } from "@/utils/errors";
import { fullPathToUploadedFile } from "@/utils/files";
import { toTitleCase } from "@/utils/format";

const createModuleServer = createServerFn({
	method: "POST",
})
	.inputValidator((data) => {
		const formData = z.instanceof(FormData).parse(data);

		return z
			.object({
				file: z.instanceof(File),
			})
			.parse({
				file: formData.get("file"),
			});
	})
	.handler(async function* ({ data }) {
		try {
			const name = data.file.name.split(".")[0] || "Untitled";
			const uploadedFile = await uploadFileServer(data.file);
			const textFile = await readTextFileServer(data.file);

			const module: ModuleSchema = {
				id: crypto.randomUUID(),
				userId: getCurrentUserId(),
				name,
				contentFilePath: uploadedFile.filePath,
				coverImagePath: textFile.coverImagePath,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			await db.execute({
				sql: `
					INSERT INTO "modules" ("id", "userId", "name", "contentFilePath", "coverImagePath", "createdAt", "updatedAt")
					VALUES ($id, $userId, $name, $contentFilePath, $coverImagePath, $createdAt, $updatedAt)
				`,
				args: {
					...module,
					coverImagePath: module.coverImagePath || null,
					createdAt: module.createdAt.toISOString(),
					updatedAt: module.updatedAt.toISOString(),
				},
			});

			yield {
				type: "start" as const,
				module,
				totalChunks: textFile.chunks.length,
			};

			let chunkIndex = -1;

			for (const textFileChunk of textFile.chunks) {
				chunkIndex++;

				const chunkEmbedding = await embedContentServer(textFileChunk.content);

				yield {
					type: "module-chunk-embedded" as const,
					chunkEmbedding,
				};

				const chunk: ModuleChunkSchema = {
					...textFileChunk,
					id: crypto.randomUUID(),
					moduleId: module.id,
					chunkIndex,
					embedding: chunkEmbedding.embedding,
				};

				await db.execute({
					sql: `
						INSERT INTO "moduleChunks" ("id", "moduleId", "content", "chunkIndex", "pageNumber", "offsetStart", "offsetEnd", "embedding")
						VALUES ($id, $moduleId, $content, $chunkIndex, $pageNumber, $offsetStart, $offsetEnd, $embedding)
					`,
					args: {
						...chunk,
						embedding: JSON.stringify(chunk.embedding),
					},
				});

				yield {
					type: "module-chunk-inserted" as const,
					chunk,
				};

				const categorizedChunks = await generateStructuredContentServer({
					content: textFileChunk.content,
					systemInstruction: MODULE_INGESTION_PROMPT,
					schema: z
						.strictObject({
							name: z.string(),
							category: categorizedModuleChunkCategorySchema,
							content: z.string(),
						})
						.array(),
				});

				for (const categorizedChunk of categorizedChunks.data) {
					const contentToEmbed = `${toTitleCase(categorizedChunk.category)}: ${categorizedChunk.name}. ${categorizedChunk.content}`;

					yield {
						type: "categorize-chunk-started" as const,
						categorizedChunk,
						contentToEmbed,
					};

					const categorizedChunkEmbedding =
						await embedContentServer(contentToEmbed);

					yield {
						type: "categorize-chunk-embedded" as const,
						categorizedChunkEmbedding,
					};

					const categorizedContentChunk: CategorizedModuleChunkSchema = {
						...categorizedChunk,
						id: crypto.randomUUID(),
						moduleId: module.id,
						moduleChunkId: chunk.id,
						embedding: categorizedChunkEmbedding.embedding,
					};

					await db.execute({
						sql: `
							INSERT INTO "categorizedModuleChunks" ("id", "moduleId", "moduleChunkId", "category", "name", "content", "embedding")
							VALUES ($id, $moduleId, $moduleChunkId, $category, $name, $content, $embedding)
						`,
						args: {
							...categorizedContentChunk,
							embedding: JSON.stringify(categorizedContentChunk.embedding),
						},
					});

					yield {
						type: "categorize-chunk-inserted" as const,
						categorizedContentChunk,
					};
				}

				yield {
					type: "chunk-completed" as const,
					module,
					chunk,
					categorizedChunks,
				};
			}

			yield {
				type: "end" as const,
				module,
			};

			return { module };
		} catch (error) {
			console.error(error);
			throw new Error("Failed to create module");
		}
	});

const getModulesServer = createServerFn({
	method: "GET",
}).handler(async () => {
	const modulesQuery = await db.execute({
		sql: `
			SELECT
				m."id",
				m."userId",
				m."name",
				m."description",
				m."coverImagePath",
				m."contentFilePath",
				m."createdAt",
				m."updatedAt",
				COALESCE(
					(
						SELECT json_group_array(
							json_object(
								'id', mc."id",
								'moduleId', mc."moduleId",
								'content', mc."content",
								'chunkIndex', mc."chunkIndex",
								'pageNumber', mc."pageNumber",
								'offsetStart', mc."offsetStart",
								'offsetEnd', mc."offsetEnd"
							)
						)
						FROM "moduleChunks" mc
						WHERE mc."moduleId" = m."id"
						ORDER BY mc."chunkIndex"
					),
					'[]'
				) AS "moduleChunks"
			FROM "modules" m
			WHERE m."userId" = $userId
			ORDER BY m."createdAt" DESC
		`,
		args: {
			userId: getCurrentUserId(),
		},
	});

	const modules = moduleSchema
		.extend({
			moduleChunks: z
				.string()
				.transform((value) =>
					moduleChunkSchema.array().parse(JSON.parse(value)),
				),
		})
		.array()
		.parse(modulesQuery.rows);

	return { modules };
});

export function ModuleSelector({
	selectedModuleIds,
	onSelectModules,
}: {
	selectedModuleIds: string[];
	onSelectModules: (modules: ModuleSchema[]) => void;
}) {
	const [processingModules, setProcessingModules] = useState<
		{
			file: File;
			totalChunks?: number;
			completedChunks?: ModuleChunkSchema[];
		}[]
	>([]);

	const getModules = useServerFn(getModulesServer);
	const createModule = useServerFn(createModuleServer);
	const getModulesQuery = useQuery({
		queryKey: ["modules"],
		queryFn: getModules,
	});

	const handleSelectedFiles = async (files: File[]) => {
		setProcessingModules((prev) => [
			...prev,
			...files.map((file) => ({ file })),
		]);

		for (const file of files) {
			const formData = new FormData();
			formData.append("file", file);

			try {
				for await (const message of await createModule({
					data: formData,
				})) {
					console.log(message);

					if (message.type === "start") {
						setProcessingModules((prev) =>
							prev.map((m) =>
								m.file === file
									? {
											...m,
											totalChunks: message.totalChunks,
										}
									: m,
							),
						);
					} else if (message.type === "chunk-completed") {
						setProcessingModules((prev) =>
							prev.map((m) =>
								m.file === file
									? {
											...m,
											completedChunks: [
												...(m.completedChunks || []),
												message.chunk,
											],
										}
									: m,
							),
						);
					} else if (message.type === "end") {
						await getModulesQuery.refetch();
					}
				}
			} catch (error) {
				handleClientError(error, {
					title: file.name,
				});
			} finally {
				setProcessingModules((prev) =>
					prev.filter((module) => module.file !== file),
				);
			}
		}
	};

	return (
		<Stack gap={0.5}>
			<FileSelect
				accept={["application/pdf", "text/plain", "text/markdown"]}
				onSelectFiles={handleSelectedFiles}
				multiple
			/>

			{processingModules.map((module) => (
				<Card key={module.file.name} padding={1} gap={0.5}>
					<Row align="center" gap={0.5}>
						<Text size="xs" color="muted">
							{module.file.name}
						</Text>

						{module.totalChunks ? (
							<Badge>
								Processing Chunk ({module.completedChunks?.length || 0} of{" "}
								{module.totalChunks})
							</Badge>
						) : (
							<Badge>Uploading</Badge>
						)}
					</Row>

					<Progress
						value={module.completedChunks?.length}
						total={module.totalChunks}
					/>
				</Card>
			))}

			{getModulesQuery.data?.modules.map((module) => (
				<Card key={module.id} padding={1} gap={1}>
					<Row align="center" gap={1}>
						<ThumbnailImage
							src={
								module.coverImagePath
									? fullPathToUploadedFile(module.coverImagePath)
									: null
							}
							alt={module.name}
							placeholder={<PencilRulerIcon size={16} />}
							aspectRatio="3 / 4"
							size={4}
						/>

						<Stack gap={0.5}>
							<Text tag="h3" size="xl" family="gothic">
								{module.name}
							</Text>
						</Stack>
					</Row>
				</Card>
			))}
		</Stack>
	);
}

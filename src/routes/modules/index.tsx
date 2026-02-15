import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { PencilRulerIcon } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Badge } from "@/components/lib/Badge";
import { Card } from "@/components/lib/Card";
import { FileSelect } from "@/components/lib/FileSelect";
import { Icon } from "@/components/lib/Icon";
import { Progress } from "@/components/lib/Progress";
import { Row } from "@/components/lib/Row";
import { Section } from "@/components/lib/Section";
import { Stack } from "@/components/lib/Stack";
import { Text } from "@/components/lib/Text";
import { ThumbnailImage } from "@/components/lib/ThumbnailImage";
import { DEFAULT_TOAST_OPTIONS, toastQueue } from "@/components/lib/Toast";
import { type ModuleSchema, moduleSchema } from "@/schemas/module";
import {
	type ModuleChunkSchema,
	moduleChunkSchema,
} from "@/schemas/module-chunk";
import { getEmbeddingModel } from "@/server/ai/models";
import { getCurrentUserId } from "@/server/auth";
import { getDb } from "@/server/db";
import { readTextFileServer } from "@/server/files/read";
import { uploadFileServer } from "@/server/files/upload";
import { handleClientError } from "@/utils/errors";
import { fullPathToUploadedFile } from "@/utils/files";
import { toRouteTitle } from "@/utils/route-title";

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
			const db = getDb();

			const name = data.file.name.split(".")[0] || "Untitled";
			const uploadedFile = await uploadFileServer(data.file);
			const textFile = await readTextFileServer(data.file);

			const module: ModuleSchema = {
				id: crypto.randomUUID(),
				userId: getCurrentUserId(),
				name,
				category: "rules",
				contentFilePath: uploadedFile.filePath,
				coverImagePath: textFile.coverImagePath,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			await db.execute({
				sql: `
				INSERT INTO "modules" ("id", "userId", "name", "category", "contentFilePath", "coverImagePath", "createdAt", "updatedAt")
				VALUES ($id, $userId, $name, $category, $contentFilePath, $coverImagePath, $createdAt, $updatedAt)
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

			const embeddingModel = getEmbeddingModel();
			let chunkIndex = -1;

			for (const textFileChunk of textFile.chunks) {
				chunkIndex++;

				const embedding = await embeddingModel.embedQuery(
					textFileChunk.content,
				);

				const chunk: ModuleChunkSchema = {
					...textFileChunk,
					id: crypto.randomUUID(),
					moduleId: module.id,
					chunkIndex,
					embedding,
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
					type: "chunk-completed" as const,
					module,
					chunk,
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
	const db = getDb();

	const modulesQuery = await db.execute({
		sql: `
			SELECT
				m."id",
				m."userId",
				m."category",
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

export const Route = createFileRoute("/modules/")({
	component: RouteComponent,
	loader: () => getModulesServer(),
	head: () => ({
		meta: [
			{
				title: toRouteTitle("Modules"),
			},
		],
	}),
});

function RouteComponent() {
	const router = useRouter();
	const data = Route.useLoaderData();

	const [processingModules, setProcessingModules] = useState<
		{
			file: File;
			totalChunks?: number;
			completedChunks?: ModuleChunkSchema[];
		}[]
	>([]);

	const createModule = useServerFn(createModuleServer);

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
						await router.invalidate();

						toastQueue.add(
							{
								title: "Module created",
								description: message.module.name,
								type: "success",
							},
							DEFAULT_TOAST_OPTIONS,
						);
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
		<Section>
			<Section.Container>
				<Stack gap={0.5}>
					<Row align="center" gap={0.5}>
						<Icon color="muted" size={1.25}>
							<PencilRulerIcon />
						</Icon>
						<Text tag="h1" size="xl" family="gothic" color="muted" weight={300}>
							Modules
						</Text>
					</Row>

					<Text size="lg">
						Rulesets, worlds, lore, and adventures that power your campaigns
					</Text>
				</Stack>

				<FileSelect
					accept={["text/plain", "text/markdown", "application/pdf"]}
					onSelectFiles={handleSelectedFiles}
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

				{data.modules.map((module) => (
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

								<Text size="sm" color="muted">
									{module.id}
								</Text>

								<Row gap={0.5}>
									<Badge uppercase>{module.category}</Badge>
									<Badge>{module.moduleChunks.length} Chunks</Badge>
									<Badge>{module.moduleChunks.at(-1)?.pageNumber} Pages</Badge>
								</Row>
							</Stack>
						</Row>

						{module.moduleChunks.map((chunk) => (
							<Card key={chunk.id} padding={1} gap={0.5}>
								<Text weight={500} size="xs" color="muted">
									Page {chunk.pageNumber}, Chunk Index {chunk.chunkIndex},
									Offset {chunk.offsetStart} - {chunk.offsetEnd}
								</Text>
								<Text whiteSpace="pre-wrap" size="sm">
									{chunk.content}
								</Text>
							</Card>
						))}
					</Card>
				))}
			</Section.Container>
		</Section>
	);
}

import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { PencilRulerIcon } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { FileSelect } from "@/components/lib/FileSelect";
import { Icon } from "@/components/lib/Icon";
import { Row } from "@/components/lib/Row";
import { Section } from "@/components/lib/Section";
import { Stack } from "@/components/lib/Stack";
import { Text } from "@/components/lib/Text";
import { toastQueue } from "@/components/lib/Toast";
import { getChatModel, getEmbeddingModel } from "@/server/ai/models";
import { getCurrentUserId } from "@/server/auth";
import { getDb } from "@/server/db";
import { readTextFileServer, uploadFileServer } from "@/server/file";
import { handleClientError } from "@/utils/errors";
import { toModuleChunkCategory } from "@/utils/module-chunks";
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
	.handler(async ({ data }) => {
		try {
			const db = getDb();

			const name = data.file.name.split(".")[0] || "Untitled";
			const uploaded = await uploadFileServer(data.file);
			const { chunks } = await readTextFileServer(data.file);

			const moduleId = crypto.randomUUID();
			const now = new Date().toISOString();

			await db.execute({
				sql: `
				INSERT INTO "modules" ("id", "userId", "name", "createdAt", "updatedAt")
				VALUES ($moduleId, $userId, $name, $createdAt, $updatedAt)
			`,
				args: {
					moduleId,
					userId: getCurrentUserId(),
					name,
					createdAt: now,
					updatedAt: now,
				},
			});

			const embeddingModel = getEmbeddingModel();
			const chatModel = getChatModel();

			for (const chunk of chunks) {
				const embedding = await embeddingModel.embedQuery(chunk.text);
				const chunkId = crypto.randomUUID();

				const categoryResponse = await chatModel.invoke([
					{
						role: "system",
						content:
							"You are a game master for a tabletop roleplaying game. You are given a chunk of text and you need to classify it into one of the following categories: 'rules' (eg: game mechanics) or 'world-building' (eg: world history, world geography, lore, general theme, etc.). Only respond with the category 'rules' or 'world-building', no other text.",
					},
					{
						role: "user",
						content: chunk.text,
					},
				]);

				const category = toModuleChunkCategory(
					categoryResponse.contentBlocks.find((block) => block.type === "text")
						?.text,
				);

				console.log({
					chunkId,
					moduleId,
					content: chunk.text,
					category,
					contentFilePath: uploaded.filePath,
					embedding: JSON.stringify(embedding),
				});

				await db.execute({
					sql: `
					INSERT INTO "moduleChunks" ("id", "moduleId", "content", "category", "contentFilePath", "embedding")
					VALUES ($chunkId, $moduleId, $content, $category, $contentFilePath, $embedding)
				`,
					args: {
						chunkId,
						moduleId,
						content: chunk.text,
						category,
						contentFilePath: uploaded.filePath,
						embedding: JSON.stringify(embedding),
					},
				});
			}

			return { success: true };
		} catch (error) {
			console.error(error);
			throw new Error("Failed to create module");
		}
	});

const getModulesServer = createServerFn({
	method: "GET",
}).handler(async (fo) => {
	const db = getDb();

	const modulesQuery = await db.execute({
		sql: `SELECT * FROM "modules" where "userId" = $userId`,
		args: {
			userId: getCurrentUserId(),
		},
	});

	const moduleChunksQuery = await db.execute({
		sql: `SELECT * FROM "moduleChunks"`,
	});

	console.dir(modulesQuery.rows, { depth: null });
	console.dir(moduleChunksQuery.rows, { depth: null });

	return { modules: modulesQuery.toJSON() };
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
	const [processingFiles, setProcessingFiles] = useState<File[]>([]);

	const createModule = useServerFn(createModuleServer);

	const handleSelectedFiles = async (files: File[]) => {
		setProcessingFiles((prev) => [...prev, ...files]);

		for (const file of files) {
			const formData = new FormData();
			formData.append("file", file);

			try {
				await createModule({
					data: formData,
				});
			} catch (error) {
				handleClientError(error, {
					title: file.name,
				});
			} finally {
				setProcessingFiles((prev) => prev.filter((f) => f !== file));
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

				{processingFiles.map((file) => (
					<Text key={file.name}>Processing: {file.name}</Text>
				))}
			</Section.Container>
		</Section>
	);
}

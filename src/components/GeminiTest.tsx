import type { FileSearchStore } from "@google/genai";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { ai, generateStructuredContentServer } from "@/server/ai";
import gameMasterPrompt from "@/server/ai/prompts/rules-analyzer.md?raw";
import { serverEnv } from "@/server/env";
import { handleClientError } from "@/utils/errors";
import { Card } from "./lib/Card";
import { FileSelect } from "./lib/FileSelect";
import { Text } from "./lib/Text";

const geminiTestQueryServer = createServerFn({
	method: "POST",
})
	.inputValidator((data) => {
		const formData = z.instanceof(FormData).parse(data);

		return z
			.object({
				file: z.instanceof(File).nullish(),
				query: z.string(),
			})
			.parse({
				file: formData.get("file"),
				query: formData.get("query"),
			});
	})
	.handler(async ({ data }) => {
		try {
			let fileSearchStore: FileSearchStore | null = null;

			try {
				fileSearchStore = await ai.fileSearchStores.get({
					name: "game-master/rules",
				});
			} catch (_error) {
				fileSearchStore = await ai.fileSearchStores.create({
					config: { displayName: "game-master/rules" },
				});
			}

			if (!fileSearchStore?.name) {
				throw new Error("File search store not found");
			}

			// if (!data.file && !fileSearchStore.activeDocumentsCount) {
			// 	throw new Error(
			// 		"No file attached and no documents in file search store",
			// 	);
			// }

			if (data.file) {
				const documents = await ai.fileSearchStores.documents.list({
					parent: fileSearchStore.name,
				});

				for await (const document of documents) {
					if (!document.name) {
						continue;
					}
					await ai.fileSearchStores.documents.delete({
						name: `${fileSearchStore.name}/${document.name}`,
						config: { force: true },
					});
				}

				let operation = await ai.fileSearchStores.uploadToFileSearchStore({
					file: data.file,
					fileSearchStoreName: fileSearchStore.name,
					config: {
						displayName: "core-rules-pdf",
						mimeType: data.file.type,
						chunkingConfig: {
							whiteSpaceConfig: {
								maxTokensPerChunk: 300,
								maxOverlapTokens: 30,
							},
						},
					},
				});

				while (!operation.done) {
					console.log("Waiting for operation to complete...");
					await new Promise((resolve) => setTimeout(resolve, 5000));
					operation = await ai.operations.get({ operation });
				}
			}

			// TODO: Try out custom RAG implementation instead of using the file search store to compare

			const result = await ai.models.generateContent({
				model: serverEnv.GOOGLE_LLM_MODEL,
				contents: [{ text: data.query }],
				config: {
					systemInstruction: gameMasterPrompt,
					// tools: [
					// 	{
					// 		fileSearch: {
					// 			fileSearchStoreNames: [fileSearchStore.name],
					// 			topK: 10,
					// 		},
					// 	},
					// ],
				},
			});
			console.log("--------------------------------");

			console.dir(result, { depth: null });

			return {
				...result,
			};
		} catch (error) {
			console.error(error);
			throw new Error("Gemini test failed");
		}
	});

export function GeminiTest() {
	const geminiTestQueryClient = useServerFn(geminiTestQueryServer);
	const [query, setQuery] = useState("");
	const [file, setFile] = useState<File | null>(null);
	const [result, setResult] = useState<Awaited<
		ReturnType<typeof geminiTestQueryClient>
	> | null>(null);

	const submit = async () => {
		try {
			// if (!file) {
			// 	return;
			// }

			const formData = new FormData();
			if (file) {
				formData.append("file", file);
			}
			formData.append("query", query);
			const result = await geminiTestQueryClient({ data: formData });
			console.log(result);
			setResult(result);
		} catch (error) {
			setResult(null);
			handleClientError(error);
		}
	};

	return (
		<Card padding={1} gap={1}>
			<FileSelect
				accept={["application/pdf"]}
				onSelectFiles={(files) => setFile(files[0])}
			/>

			<textarea
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder="Enter your query here..."
			/>

			<button type="button" onClick={submit}>
				Submit
			</button>
		</Card>
	);
}

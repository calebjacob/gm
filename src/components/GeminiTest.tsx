import type { FileSearchStore } from "@google/genai";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { ai, generateStructuredContentServer } from "@/server/ai";
import gameMasterPrompt from "@/server/ai/prompts/rules-analyzer.md?raw";
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
				file: z.instanceof(File),
				query: z.string(),
			})
			.parse({
				file: formData.get("file"),
				query: formData.get("query"),
			});
	})
	.handler(async ({ data }) => {
		try {
			const buffer = await data.file.arrayBuffer();
			const base64Buffer = Buffer.from(buffer).toString("base64");

			const contents = [
				{
					inlineData: {
						mimeType: "application/pdf",
						data: base64Buffer,
					},
				},
				{ text: data.query },
			];

			const schema = z.object({
				sources: z
					.array(
						z.object({
							pageNumber: z.number(),
							content: z.string(),
						}),
					)
					.describe(
						"The references and rules used within the document to answer the player's request.",
					),
				message: z
					.string()
					.describe("The game master's response to the player's request."),
			});

			const response = await generateStructuredContentServer({
				contents: contents,
				systemInstruction: gameMasterPrompt,
				schema,
			});

			return {};
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

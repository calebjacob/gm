import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { findRelevantModuleChunksServer } from "@/server/rag/retrieve";
import { Card } from "./lib/Card";
import { Text } from "./lib/Text";

const ragQueryServer = createServerFn({
	method: "POST",
})
	.inputValidator(z.object({ query: z.string(), campaignId: z.string() }))
	.handler(async ({ data }) => {
		try {
			const result = await findRelevantModuleChunksServer({
				query: data.query,
				campaignId: data.campaignId,
				limit: 10,
				relevanceThreshold: 0.5,
			});

			return result;
		} catch (error) {
			console.error(error);
			throw new Error("Campaign query failed");
		}
	});

export function QueryTest({ campaignId }: { campaignId: string }) {
	const ragQuery = useServerFn(ragQueryServer);
	const [query, setQuery] = useState("");
	const [ragQueryResults, setRagQueryResults] = useState<Awaited<
		ReturnType<typeof ragQuery>
	> | null>(null);

	const submit = async () => {
		try {
			const result = await ragQuery({ data: { query, campaignId } });
			console.log(result);
			setRagQueryResults(result);
		} catch (error) {
			console.error(error);
			setRagQueryResults(null);
		}
	};

	return (
		<>
			<Card padding={1} gap={1}>
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Query"
				/>

				<button type="button" onClick={submit}>
					Search
				</button>
			</Card>

			<Text size="xl" weight={600}>
				Categorized Module Chunks
			</Text>

			{ragQueryResults?.categorizedModuleChunks.map((chunk) => (
				<Card key={chunk.id} padding={1} gap={1}>
					<Text size="md" weight={600}>
						{chunk.category}: {chunk.name}
					</Text>
					<Text size="sm" whiteSpace="pre-wrap">
						{chunk.content}
					</Text>
				</Card>
			))}

			<Text size="xl" weight={600}>
				Module Chunks
			</Text>

			{ragQueryResults?.moduleChunks.map((chunk) => (
				<Card key={chunk.id} padding={1} gap={1}>
					<Text size="md" weight={600}>
						Page {chunk.pageNumber}, Chunk Index {chunk.chunkIndex}, Offset{" "}
						{chunk.offsetStart} - {chunk.offsetEnd}
					</Text>

					<Text size="sm" whiteSpace="pre-wrap">
						{chunk.content}
					</Text>
				</Card>
			))}
		</>
	);
}

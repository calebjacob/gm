import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { findRelevantModuleChunksServer } from "@/server/rag/retrieve";
import { Card } from "./lib/Card";

const ragQueryServer = createServerFn({
	method: "POST",
})
	.inputValidator(z.object({ query: z.string(), campaignId: z.string() }))
	.handler(async ({ data }) => {
		try {
			const result = await findRelevantModuleChunksServer({
				query: data.query,
				campaignId: data.campaignId,
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

	const submit = async () => {
		try {
			const result = await ragQuery({ data: { query, campaignId } });
			console.log(result);
		} catch (error) {
			console.error(error);
		}
	};

	return (
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
	);
}

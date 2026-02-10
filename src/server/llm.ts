import { ChatOpenAI } from "@langchain/openai";
import { getLlmConfig } from "./config/llm.js";

let chatModel: ChatOpenAI | null = null;

export function getChatModel(): ChatOpenAI {
	if (!chatModel) {
		const { baseURL, model, apiKey } = getLlmConfig();
		chatModel = new ChatOpenAI({
			model,
			configuration: {
				baseURL,
				apiKey: apiKey || undefined,
			},
		});
	}
	return chatModel;
}

export async function generateNameAndDescription(
	textSample: string,
): Promise<{ name: string; description: string }> {
	const sample = textSample.slice(0, 2000).trim();
	if (!sample) {
		return { name: "Untitled", description: "" };
	}
	try {
		const model = getChatModel();
		const result = await model.invoke([
			{
				role: "user",
				content: `Given the following text excerpt from a ruleset or world document, respond with exactly two short lines:
Line 1: A concise title (a few words, no quotes).
Line 2: A one- or two-sentence description.

Text:
${sample}`,
			},
		]);
		const content =
			typeof result.content === "string"
				? result.content
				: String(result.content);
		const lines = content
			.split(/\r?\n/)
			.map((l) => l.trim())
			.filter(Boolean);
		const name = lines[0]?.replace(/^["']|["']$/g, "").trim() || "Untitled";
		const description =
			lines
				.slice(1)
				.join(" ")
				.replace(/^["']|["']$/g, "")
				.trim() || "";
		return { name, description };
	} catch {
		const firstLine =
			sample.split(/\r?\n/)[0]?.trim().slice(0, 50) || "Untitled";
		return { name: firstLine || "Untitled", description: "" };
	}
}

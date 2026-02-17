import {
	type ContentListUnion,
	type CreateChatParameters,
	GoogleGenAI,
} from "@google/genai";
import { createServerOnlyFn } from "@tanstack/react-start";
import type { ZodArray, ZodObject, z } from "zod";
import { serverEnv } from "@/server/env";

// https://ai.google.dev/gemini-api/docs/text-generation
// https://ai.google.dev/gemini-api/docs/structured-output

export const ai = new GoogleGenAI({
	apiKey: serverEnv.EMBEDDING_API_KEY,
});

export const embedContentServer = createServerOnlyFn(
	async (content: string) => {
		const result = await ai.models.embedContent({
			model: serverEnv.EMBEDDING_MODEL,
			contents: [content],
			config: {
				outputDimensionality: Number(serverEnv.EMBEDDING_DIMENSION),
				taskType: "SEMANTIC_SIMILARITY",
			},
		});

		console.log("Embed content result:", result);

		return {
			embedding: result.embeddings?.[0]?.values ?? [],
		};
	},
);

export const generateStructuredContentServer = createServerOnlyFn(
	async <TSchema extends ZodObject | ZodArray>({
		content,
		schema,
		systemInstruction,
	}: {
		content: ContentListUnion;
		schema: TSchema;
		systemInstruction: string;
	}): Promise<{ data: z.infer<TSchema> }> => {
		const result = await ai.models.generateContent({
			model: serverEnv.LLM_MODEL,
			contents: content,
			config: {
				responseMimeType: "application/json",
				responseSchema: schema.toJSONSchema(),
				systemInstruction,
			},
		});

		console.log("Generate structured content result:", result);

		const data = schema.parse(
			JSON.parse(result.text ?? ""),
		) as z.infer<TSchema>;

		return {
			data,
		};
	},
);

type ChatHistoryEntry = Omit<
	NonNullable<CreateChatParameters["history"]>[number],
	"role"
> & {
	role: "user" | "model";
};

export const createChatServer = createServerOnlyFn(
	async ({
		history,
		systemInstruction,
	}: {
		history: ChatHistoryEntry[];
		systemInstruction: string;
	}) => {
		const chat = ai.chats.create({
			model: serverEnv.LLM_MODEL,
			history: history,
			config: {
				systemInstruction,
			},
		});

		return chat;
	},
);

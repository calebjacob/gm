import {
	type ContentListUnion,
	type CreateChatParameters,
	type GenerateContentResponse,
	GoogleGenAI,
	type Tool,
} from "@google/genai";
import { createServerOnlyFn } from "@tanstack/react-start";
import type { ZodArray, ZodObject, z } from "zod";
import { serverEnv } from "@/server/env";

// https://ai.google.dev/gemini-api/docs/text-generation
// https://ai.google.dev/gemini-api/docs/structured-output

export const ai = new GoogleGenAI({
	apiKey: serverEnv.GOOGLE_AI_API_KEY,
});

export const embedContentServer = createServerOnlyFn(
	async (content: string) => {
		const result = await ai.models.embedContent({
			model: serverEnv.GOOGLE_EMBEDDING_MODEL,
			contents: [content],
			config: {
				outputDimensionality: serverEnv.GOOGLE_EMBEDDING_DIMENSION,
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
		contents,
		schema,
		systemInstruction,
		tools,
	}: {
		contents: ContentListUnion;
		schema: TSchema;
		systemInstruction: string;
		tools?: Tool[];
	}): Promise<{
		data: z.infer<TSchema>;
		response: GenerateContentResponse;
	}> => {
		const response = await ai.models.generateContent({
			model: serverEnv.GOOGLE_LLM_MODEL,
			contents: contents,
			config: {
				responseMimeType: "application/json",
				responseSchema: schema.toJSONSchema(),
				systemInstruction,
				tools,
			},
		});

		console.log("Generate structured content result:", response);

		const data = schema.parse(
			JSON.parse(response.text ?? ""),
		) as z.infer<TSchema>;

		return {
			data,
			response,
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
			model: serverEnv.GOOGLE_LLM_MODEL,
			history: history,
			config: {
				systemInstruction,
			},
		});

		return chat;
	},
);

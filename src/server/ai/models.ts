import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { serverEnv } from "@/server/env";

let chatModel: ChatOpenAI | null = null;
let embeddingModel: OpenAIEmbeddings | null = null;

export function getChatModel(): ChatOpenAI {
	if (!chatModel) {
		chatModel = new ChatOpenAI({
			model: serverEnv.LLM_MODEL,
			configuration: {
				baseURL: serverEnv.LLM_BASE_URL,
				apiKey: serverEnv.LLM_API_KEY || "none",
			},
		});
	}

	return chatModel;
}

export function getEmbeddingModel(): OpenAIEmbeddings {
	if (!embeddingModel) {
		embeddingModel = new OpenAIEmbeddings({
			model: serverEnv.EMBEDDING_MODEL,
			encodingFormat: "float",
			configuration: {
				baseURL: serverEnv.EMBEDDING_BASE_URL,
				apiKey: serverEnv.EMBEDDING_API_KEY || "none",
			},
		});
	}

	return embeddingModel;
}

import { ChatOpenAI } from "@langchain/openai";
import { getServerEnv } from "@/utils/env";

let model: ChatOpenAI | null = null;

export function getChatModel(): ChatOpenAI {
	if (!model) {
		const env = getServerEnv();

		console.log(env);

		model = new ChatOpenAI({
			model: env.LLM_MODEL,
			configuration: {
				baseURL: env.LLM_BASE_URL,
				apiKey: env.LLM_API_KEY || "none",
			},
		});
	}

	return model;
}

import { getConfig } from "./env.js";

export function getLlmConfig() {
  const env = getConfig();
  return {
    baseURL: env.LLM_BASE_URL,
    model: env.LLM_MODEL,
    apiKey: env.LLM_API_KEY || undefined,
  };
}

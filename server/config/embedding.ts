import { getConfig } from "./env.js";

export function getEmbeddingConfig() {
  const env = getConfig();
  return {
    model: env.EMBEDDING_MODEL,
    baseURL: env.EMBEDDING_BASE_URL,
    apiKey: env.EMBEDDING_API_KEY || undefined,
    dimension: env.EMBEDDING_DIMENSION,
    rembedExtensionPath: env.REMBED_EXTENSION_PATH,
  };
}

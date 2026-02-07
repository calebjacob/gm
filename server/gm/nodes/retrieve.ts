import type { GMStateType } from "../state.js";
import { retrieve as doRetrieve } from "../../rag/retrieve.js";

export type RetrieveConfig = {
  rulesetId: string;
  worldId: string;
};

export async function retrieveNode(
  state: GMStateType,
  config?: { configurable?: Record<string, unknown> }
): Promise<Partial<GMStateType>> {
  const cfg = config?.configurable as RetrieveConfig | undefined;
  if (!cfg?.rulesetId || !cfg?.worldId) {
    return { rulesContext: "", campaignContext: "" };
  }
  const messages = state.messages ?? [];
  const lastUser = [...messages].reverse().find((m) => m._getType() === "human");
  const queryText = typeof lastUser?.content === "string" ? lastUser.content : String(lastUser?.content ?? "");
  const { rulesContext, campaignContext } = doRetrieve(queryText, cfg.rulesetId, cfg.worldId, 5);
  return { rulesContext, campaignContext };
}

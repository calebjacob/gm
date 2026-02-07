import type { BaseMessage } from "@langchain/core/messages";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { GMStateType } from "../state.js";
import { getChatModel } from "../../llm.js";

export type GMConfig = {
  characterReferences?: { characterId: string; name: string }[];
};

export async function gmNode(
  state: GMStateType,
  config?: { configurable?: Record<string, unknown> }
): Promise<Partial<GMStateType>> {
  const rulesContext = state.rulesContext ?? "";
  const campaignContext = state.campaignContext ?? "";
  const characterRefs = (config?.configurable as GMConfig | undefined)?.characterReferences ?? [];
  let systemContent = `You are the Game Master. Apply these rules and run the game accordingly.

Rules:
${rulesContext || "(No rules retrieved.)"}

World and story:
${campaignContext || "(No world context retrieved.)"}

Respond to the player and resolve their action.`;
  if (characterRefs.length > 0) {
    systemContent += `\n\nThe player has referenced these characters (id, name): ${characterRefs.map((c) => `${c.characterId}: ${c.name}`).join(", ")}. Use them for context when relevant.`;
  }
  const systemMessage = new SystemMessage(systemContent);
  const chatModel = getChatModel();
  const messages: BaseMessage[] = [systemMessage, ...(state.messages ?? [])];
  const response = await chatModel.invoke(messages);
  const aiMessage = response instanceof AIMessage ? response : new AIMessage(typeof response.content === "string" ? response.content : String(response.content));
  return { messages: [aiMessage] };
}

import type { BaseMessage } from "@langchain/core/messages";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { getChatModel } from "../models";
import type { GraphStateType } from "./game-master-state";

export type GameMasterNodeConfig = {
	characterReferences?: { characterId: string; name: string }[];
};

export async function gameMasterNode(
	state: GraphStateType,
	config?: { configurable?: Record<string, unknown> },
): Promise<Partial<GraphStateType>> {
	const rulesContext = state.rulesContext ?? "";
	const worldBuildingContext = state.worldBuildingContext ?? "";

	const characterRefs =
		(config?.configurable as GameMasterNodeConfig | undefined)
			?.characterReferences ?? [];

	let systemContent = `You are the Game Master. Apply these rules and run the game accordingly.

Rules:
${rulesContext || "(No rules context retrieved.)"}

World-building, theme, lore, and story:
${worldBuildingContext || "(No world-building context retrieved.)"}

Respond to the player and resolve their action.`;

	if (characterRefs.length > 0) {
		systemContent += `\n\nThe player has referenced these characters (id, name): ${characterRefs.map((c) => `${c.characterId}: ${c.name}`).join(", ")}. Use them for context when relevant.`;
	}

	const systemMessage = new SystemMessage(systemContent);
	const chatModel = getChatModel();
	const messages: BaseMessage[] = [systemMessage, ...(state.messages ?? [])];
	const response = await chatModel.invoke(messages);
	const aiMessage =
		response instanceof AIMessage
			? response
			: new AIMessage(
					typeof response.content === "string"
						? response.content
						: String(response.content),
				);

	return { messages: [aiMessage] };
}

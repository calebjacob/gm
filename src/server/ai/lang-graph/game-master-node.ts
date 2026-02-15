import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { getChatModel } from "../models";
import type { GraphStateType } from "./state";

export async function gameMasterNode(
	state: GraphStateType,
): Promise<Partial<GraphStateType>> {
	const rulesContext =
		state.relevantModuleChunks?.map((chunk) => chunk.content).join("\n") ?? "";
	const worldBuildingContext =
		state.relevantModuleChunks?.map((chunk) => chunk.content).join("\n") ?? "";

	// const characterRefs =
	// 	(config?.configurable as GameMasterNodeConfig | undefined)
	// 		?.characterReferences ?? [];

	const systemContent = `You are the Game Master running a tabletop roleplaying game. Apply these rules and run the game accordingly.

Rules:
${rulesContext || "(No rules context retrieved.)"}

World-building, theme, lore, and story:
${worldBuildingContext || "(No world-building context retrieved.)"}

Respond to the player and resolve their action.`;

	// if (characterRefs.length > 0) {
	// 	systemContent += `\n\nThe player has referenced these characters (id, name): ${characterRefs.map((c) => `${c.characterId}: ${c.name}`).join(", ")}. Use them for context when relevant.`;
	// }

	const systemMessage = new SystemMessage(systemContent);
	const chatModel = getChatModel();
	const messages = [systemMessage, ...(state.messages ?? [])];
	const response = await chatModel.invoke(messages);

	console.log("gameMasterMessage response: ", response);

	const gameMasterMessage =
		response instanceof AIMessage
			? response
			: new AIMessage(
					typeof response.content === "string"
						? response.content
						: String(response.content),
				);

	return { messages: [gameMasterMessage] };
}

import { findRelevantModuleChunksServer } from "@/server/rag/retrieve";
import type { GraphStateType } from "./state";

export type RetrieveNodeConfig = {
	campaignId: string;
};

export async function retrieveNode(
	state: GraphStateType,
): Promise<Partial<GraphStateType>> {
	const messages = state.messages;
	const lastHumanMessage = [...messages]
		.reverse()
		.find((m) => m.type === "human");

	const query = lastHumanMessage?.text ?? "";

	const { campaign, moduleChunks: relevantModuleChunks } =
		await findRelevantModuleChunksServer({
			campaignId: state.campaignId,
			limit: 3,
			query,
		});

	return {
		campaign,
		relevantModuleChunks,
	};
}

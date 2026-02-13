import { retrieve } from "@/server/rag/retrieve";
import type { GraphStateType } from "./game-master-state";

export type RetrieveNodeConfig = {
	campaignId: string;
};

export async function retrieveNode(
	state: GraphStateType,
	config?: { configurable?: Record<string, unknown> },
): Promise<Partial<GraphStateType>> {
	const cfg = config?.configurable as RetrieveNodeConfig | undefined;

	if (!cfg?.campaignId) {
		return { rulesContext: "", worldBuildingContext: "" };
	}

	const messages = state.messages ?? [];
	const lastHumanMessage = [...messages]
		.reverse()
		.find((m) => m.type === "human");
	const query = lastHumanMessage?.text ?? "";

	const { moduleChunks } = await retrieve({
		query,
		campaignId: cfg.campaignId,
	});

	const rulesContext = moduleChunks
		.filter((chunk) => chunk.module.category === "rules")
		.map((chunk) => chunk.content)
		.join("\n");

	const worldBuildingContext = moduleChunks
		.filter((chunk) => chunk.module.category === "world-building")
		.map((chunk) => chunk.content)
		.join("\n");

	return { rulesContext, worldBuildingContext };
}

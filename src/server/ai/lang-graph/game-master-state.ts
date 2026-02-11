import type { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";

export const GameMasterState = Annotation.Root({
	messages: Annotation<BaseMessage[]>({
		reducer: (curr, update) =>
			Array.isArray(update) ? curr.concat(update) : curr.concat([update]),
		default: () => [],
	}),
	rulesContext: Annotation<string>({
		reducer: (_, u) => u,
		default: () => "",
	}),
	worldBuildingContext: Annotation<string>({
		reducer: (_, u) => u,
		default: () => "",
	}),
});

export type GraphStateType = typeof GameMasterState.State;

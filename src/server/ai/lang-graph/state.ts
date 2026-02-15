// https://docs.langchain.com/oss/javascript/langgraph/graph-api

import { MessagesValue, StateSchema } from "@langchain/langgraph";
import { z } from "zod";
import { campaignSchema } from "@/schemas/campaign";
import { relevantModuleChunkSchema } from "@/server/rag/retrieve";

export const GraphState = new StateSchema({
	campaignId: z.string(),
	campaign: campaignSchema.optional(),
	messages: MessagesValue,
	relevantModuleChunks: relevantModuleChunkSchema.array().optional(),
});

export type GraphStateType = typeof GraphState.State;
export type GraphUpdateStateType = typeof GraphState.Update;

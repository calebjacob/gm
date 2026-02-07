import { Annotation } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";

export const GMState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (curr, update) => (Array.isArray(update) ? curr.concat(update) : curr.concat([update])),
    default: () => [],
  }),
  rulesContext: Annotation<string>({
    reducer: (_, u) => u,
    default: () => "",
  }),
  campaignContext: Annotation<string>({
    reducer: (_, u) => u,
    default: () => "",
  }),
});

export type GMStateType = typeof GMState.State;

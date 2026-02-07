import { StateGraph, START, END } from "@langchain/langgraph";
import { GMState } from "./state.js";
import { retrieveNode } from "./nodes/retrieve.js";
import { gmNode } from "./nodes/gm.js";

const graph = new StateGraph(GMState)
  .addNode("retrieve", retrieveNode)
  .addNode("gm", gmNode)
  .addEdge(START, "retrieve")
  .addEdge("retrieve", "gm")
  .addEdge("gm", END);

export const gmGraph = graph.compile();

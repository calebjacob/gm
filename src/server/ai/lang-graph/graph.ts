import { END, START, StateGraph } from "@langchain/langgraph";
import { gameMasterNode } from "./game-master-node";
import { retrieveNode } from "./retrieve-node";
import { GraphState } from "./state";

const graph = new StateGraph(GraphState)

	.addNode("retrieve", retrieveNode)
	.addNode("game-master", gameMasterNode)

	.addEdge(START, "retrieve")
	.addEdge("retrieve", "game-master")
	.addEdge("game-master", END);

export const gameMasterGraph = graph.compile();

// TODO: Play around with calling the graph
// TODO: Decide if an agent node with tools is helpful

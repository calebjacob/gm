import { END, START, StateGraph } from "@langchain/langgraph";
import { gameMasterNode } from "./game-master-node";
import { GameMasterState } from "./game-master-state";
import { retrieveNode } from "./retrieve-node";

const graph = new StateGraph(GameMasterState)
	.addNode("retrieve", retrieveNode)
	.addNode("game-master", gameMasterNode)
	.addEdge(START, "retrieve")
	.addEdge("retrieve", "game-master")
	.addEdge("game-master", END);

export const gameMasterGraph = graph.compile();

// TODO: Call graph

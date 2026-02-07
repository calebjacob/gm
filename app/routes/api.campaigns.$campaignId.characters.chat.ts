import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

export async function action({
  params,
  request,
}: {
  params: { campaignId: string };
  request: Request;
}) {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let body: { messages?: { role: string; content: string }[] };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const { getDatabase } = await import("server/db");
  const { getCurrentUserId } = await import("server/auth");
  const { retrieve } = await import("server/rag/retrieve");
  const { getChatModel } = await import("server/llm");
  const db = getDatabase();
  const userId = getCurrentUserId();
  const campaign = db
    .prepare('SELECT "rulesetId", "worldId" FROM "campaigns" WHERE "id" = ? AND "userId" = ?')
    .get(params.campaignId, userId) as { rulesetId: string; worldId: string } | undefined;
  if (!campaign) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const lcMessages = messages.map((m) =>
    m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
  );
  const lastContent = messages[messages.length - 1]?.content ?? "";
  const { rulesContext, campaignContext } = retrieve(lastContent, campaign.rulesetId, campaign.worldId, 5, db);
  const systemContent = `You are helping the player create a character for this campaign. Use the following rules and world context. When you have enough information, respond with a JSON code block containing: name, race, className, description, skills (array), statistics (object), items (array).

Rules:
${rulesContext || "(none)"}

World:
${campaignContext || "(none)"}`;
  const fullMessages = [new SystemMessage(systemContent), ...lcMessages];
  const model = getChatModel();
  const response = await model.invoke(fullMessages);
  const content = typeof response.content === "string" ? response.content : String(response.content);
  return Response.json({ content });
}

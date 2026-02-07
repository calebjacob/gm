import type { BaseMessage } from "@langchain/core/messages";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

export async function action({
  params,
  request,
}: {
  params: { campaignId: string };
  request: Request;
}) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const campaignId = params.campaignId;
  let body: { content?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return new Response(JSON.stringify({ error: "content is required" }), { status: 400 });
  }

  const { getDatabase } = await import("server/db");
  const { getCurrentUserId } = await import("server/auth");
  const { gmGraph } = await import("server/gm/graph");
  const { resolveCharacterReferences } = await import("server/characters");
  const db = getDatabase();
  const userId = getCurrentUserId();

  const campaign = db
    .prepare(
      'SELECT "id", "rulesetId", "worldId" FROM "campaigns" WHERE "id" = ? AND "userId" = ?'
    )
    .get(campaignId, userId) as { id: string; rulesetId: string; worldId: string } | undefined;
  if (!campaign) {
    return new Response(JSON.stringify({ error: "Campaign not found" }), { status: 404 });
  }

  const characters = db
    .prepare('SELECT "id", "name" FROM "characters" WHERE "campaignId" = ?')
    .all(campaignId) as { id: string; name: string }[];
  const characterReferences = resolveCharacterReferences(content, characters);

  const historyRows = db
    .prepare(
      'SELECT "role", "content" FROM "campaignMessages" WHERE "campaignId" = ? ORDER BY "createdAt"'
    )
    .all(campaignId) as { role: string; content: string }[];

  const messages: BaseMessage[] = historyRows.map((r) =>
    r.role === "user"
      ? new HumanMessage(r.content)
      : new AIMessage(r.content)
  );
  messages.push(new HumanMessage(content));

  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO "campaignMessages" ("id", "campaignId", "role", "content", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?)`
  ).run(crypto.randomUUID(), campaignId, "user", content, now, now);

  const config = {
    configurable: {
      rulesetId: campaign.rulesetId,
      worldId: campaign.worldId,
      characterReferences,
    },
  };

  const streamPromise = gmGraph.stream(
    { messages },
    { ...config, streamMode: "messages" as const }
  );

  let fullAssistantContent = "";
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = await streamPromise;
        for await (const value of stream) {
          const [msgChunk, metadata] = Array.isArray(value) ? value : [value, {}];
          const meta = metadata as { langgraph_node?: string };
          if (meta?.langgraph_node === "gm" && msgChunk?.content) {
            const content = typeof msgChunk.content === "string" ? msgChunk.content : String(msgChunk.content);
            fullAssistantContent += content;
            controller.enqueue(encoder.encode(`event: message\ndata: ${JSON.stringify({ content })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ done: true })}\n\n`));
      } catch (err) {
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: String(err) })}\n\n`));
      } finally {
        if (fullAssistantContent) {
          db.prepare(
            `INSERT INTO "campaignMessages" ("id", "campaignId", "role", "content", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?)`
          ).run(crypto.randomUUID(), campaignId, "assistant", fullAssistantContent, new Date().toISOString(), new Date().toISOString());
        }
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

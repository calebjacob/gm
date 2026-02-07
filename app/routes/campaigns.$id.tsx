import { Link, useLoaderData } from "react-router";
import { Box, Button, Typography } from "@mui/material";
import { Plus } from "lucide-react";
import { CampaignChat, type CharacterSummary } from "~/components/CampaignChat";
import type { Route } from "./+types/campaigns.$id";

export async function loader({ params }: Route.LoaderArgs) {
  const { getDatabase } = await import("server/db");
  const { getCurrentUserId } = await import("server/auth");
  const db = getDatabase();
  const userId = getCurrentUserId();
  const campaign = db
    .prepare(
      `SELECT c."id", c."name", c."rulesetId", c."worldId", r."name" as "rulesetName", w."name" as "worldName"
       FROM "campaigns" c
       JOIN "rulesets" r ON r."id" = c."rulesetId"
       JOIN "worlds" w ON w."id" = c."worldId"
       WHERE c."id" = ? AND c."userId" = ?`
    )
    .get(params.id, userId) as {
      id: string;
      name: string;
      rulesetId: string;
      worldId: string;
      rulesetName: string;
      worldName: string;
    } | undefined;
  if (!campaign) throw new Response("Not Found", { status: 404 });

  const characters = db
    .prepare(
      'SELECT "id", "name", "race", "className", "description", "imagePath", "skills", "statistics", "items" FROM "characters" WHERE "campaignId" = ? ORDER BY "createdAt"'
    )
    .all(params.id) as CharacterSummary[];

  const messageRows = db
    .prepare(
      'SELECT "id", "role", "content" FROM "campaignMessages" WHERE "campaignId" = ? ORDER BY "createdAt"'
    )
    .all(params.id) as { id: string; role: string; content: string }[];

  const messages = messageRows.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  return {
    campaign: { id: campaign.id, name: campaign.name, rulesetName: campaign.rulesetName, worldName: campaign.worldName },
    characters,
    messages,
  };
}

export function meta({ data }: Route.MetaArgs): Route.MetaDescriptors {
  return [{ title: data?.campaign ? `${data.campaign.name} — GM` : "Campaign — GM" }];
}

export default function CampaignDetail() {
  const { campaign, characters, messages } = useLoaderData() as Route.ComponentProps["loaderData"];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="overline" component={Link} to="/campaigns" sx={{ textDecoration: "none" }}>
          Campaigns
        </Typography>
        <Typography variant="h6">{campaign.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {campaign.rulesetName} · {campaign.worldName}
        </Typography>
        <Button component={Link} to={`/campaigns/${campaign.id}/characters/new`} size="small" startIcon={<Plus size={16} />}>
          Add character
        </Button>
      </Box>
      <CampaignChat campaignId={campaign.id} characters={characters} messages={messages} />
    </Box>
  );
}

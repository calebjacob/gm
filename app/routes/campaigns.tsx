import { Link, useLoaderData } from "react-router";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import { Plus } from "lucide-react";
import type { Route } from "./+types/campaigns";

export async function loader() {
  const { getDatabase } = await import("server/db");
  const { getCurrentUserId } = await import("server/auth");
  const db = getDatabase();
  const userId = getCurrentUserId();
  const rows = db
    .prepare(
      `SELECT c."id", c."name", c."coverImagePath", c."createdAt",
              r."name" as "rulesetName", w."name" as "worldName"
       FROM "campaigns" c
       JOIN "rulesets" r ON r."id" = c."rulesetId"
       JOIN "worlds" w ON w."id" = c."worldId"
       WHERE c."userId" = ?
       ORDER BY c."updatedAt" DESC`
    )
    .all(userId) as { id: string; name: string; coverImagePath: string | null; createdAt: string; rulesetName: string; worldName: string }[];
  return { campaigns: rows };
}

export function meta(): Route.MetaDescriptors {
  return [{ title: "Campaigns — GM" }];
}

export default function Campaigns() {
  const { campaigns } = useLoaderData() as Route.ComponentProps["loaderData"];
  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4">Campaigns</Typography>
        <Button component={Link} to="/campaigns/new" variant="contained" startIcon={<Plus size={18} />}>
          New Campaign
        </Button>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {campaigns.length === 0 ? (
          <Typography color="text.secondary">No campaigns yet. Create one by selecting a ruleset and world.</Typography>
        ) : (
          campaigns.map((c) => (
            <Card key={c.id} component={Link} to={`/campaigns/${c.id}`} sx={{ textDecoration: "none", color: "inherit" }}>
              <CardContent>
                <Typography variant="h6">{c.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {c.rulesetName} · {c.worldName}
                </Typography>
              </CardContent>
            </Card>
          ))
        )}
      </Box>
    </Box>
  );
}

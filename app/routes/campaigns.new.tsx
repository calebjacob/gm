import { Link, redirect, useActionData, useLoaderData, useNavigation } from "react-router";
import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import type { Route } from "./+types/campaigns.new";

export async function loader() {
  const { getDatabase } = await import("server/db");
  const { getCurrentUserId } = await import("server/auth");
  const db = getDatabase();
  const userId = getCurrentUserId();
  const rulesets = db.prepare('SELECT "id", "name" FROM "rulesets" WHERE "userId" = ? ORDER BY "name"').all(userId) as { id: string; name: string }[];
  const worlds = db.prepare('SELECT "id", "name" FROM "worlds" WHERE "userId" = ? ORDER BY "name"').all(userId) as { id: string; name: string }[];
  return { rulesets, worlds };
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") return null;
  const { getDatabase } = await import("server/db");
  const { getCurrentUserId } = await import("server/auth");
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const rulesetId = String(formData.get("rulesetId") ?? "");
  const worldId = String(formData.get("worldId") ?? "");
  if (!name) return { error: "Name is required." };
  if (!rulesetId) return { error: "Select a ruleset." };
  if (!worldId) return { error: "Select a world." };

  const db = getDatabase();
  const userId = getCurrentUserId();
  const campaignId = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO "campaigns" ("id", "userId", "rulesetId", "worldId", "name", "createdAt", "updatedAt")
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(campaignId, userId, rulesetId, worldId, name, now, now);
  throw redirect(`/campaigns/${campaignId}`);
}

export function meta(): Route.MetaDescriptors {
  return [{ title: "New Campaign — GM" }];
}

export default function CampaignsNew() {
  const { rulesets, worlds } = useLoaderData() as Route.ComponentProps["loaderData"];
  const actionData = useActionData() as Route.ComponentProps["actionData"];
  const navigation = useNavigation();
  const error = actionData && typeof actionData === "object" && "error" in actionData ? (actionData as { error: string }).error : null;
  const submitting = navigation.state === "submitting";

  return (
    <Box sx={{ p: 3, maxWidth: 500, mx: "auto" }}>
      <Typography variant="h5" sx={{ mb: 2 }}>New Campaign</Typography>
      <form method="post">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField name="name" label="Campaign name" required fullWidth />
          <FormControl fullWidth required>
            <InputLabel>Ruleset</InputLabel>
            <Select name="rulesetId" label="Ruleset">
              {rulesets.map((r) => (
                <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth required>
            <InputLabel>World</InputLabel>
            <Select name="worldId" label="World">
              {worlds.map((w) => (
                <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {error && <Typography color="error">{error}</Typography>}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "Creating…" : "Create Campaign"}
            </Button>
            <Button component={Link} to="/campaigns">Cancel</Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
}

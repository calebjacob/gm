import { Link, redirect, useSubmit, useLoaderData, useActionData, useNavigation } from "react-router";
import { Box, Typography } from "@mui/material";
import { CharacterForm, type CharacterFormData } from "~/components/CharacterForm";
import type { Route } from "./+types/campaigns.$id.characters.new";

export async function loader({ params }: Route.LoaderArgs) {
  const { getDatabase } = await import("server/db");
  const { getCurrentUserId } = await import("server/auth");
  const db = getDatabase();
  const userId = getCurrentUserId();
  const campaign = db
    .prepare('SELECT "id", "name" FROM "campaigns" WHERE "id" = ? AND "userId" = ?')
    .get(params.id, userId) as { id: string; name: string } | undefined;
  if (!campaign) throw new Response("Not Found", { status: 404 });
  let suggestions: { races: string[]; classes: string[]; skills: string[]; items: string[] } = { races: [], classes: [], skills: [], items: [] };
  try {
    const res = await fetch(`/api/campaigns/${params.id}/character-suggestions`);
    if (res.ok) suggestions = await res.json();
  } catch {}
  return { campaign, suggestions };
}

export async function action({ params, request }: Route.ActionArgs) {
  if (request.method !== "POST") return null;
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const { getDatabase } = await import("server/db");
  const { getCurrentUserId } = await import("server/auth");
  const db = getDatabase();
  const userId = getCurrentUserId();
  const campaign = db
    .prepare('SELECT "id" FROM "campaigns" WHERE "id" = ? AND "userId" = ?')
    .get(params.id, userId) as { id: string } | undefined;
  if (!campaign) throw new Response("Not Found", { status: 404 });

  const characterId = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO "characters" ("id", "campaignId", "name", "race", "className", "description", "skills", "statistics", "items", "createdAt", "updatedAt")
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    characterId,
    params.id,
    name,
    String(formData.get("race") ?? "").trim() || null,
    String(formData.get("className") ?? "").trim() || null,
    String(formData.get("description") ?? "").trim() || null,
    String(formData.get("skills") ?? "").trim() || null,
    String(formData.get("statistics") ?? "").trim() || null,
    String(formData.get("items") ?? "").trim() || null,
    now,
    now
  );
  throw redirect(`/campaigns/${params.id}`);
}

export function meta({ data }: Route.MetaArgs): Route.MetaDescriptors {
  return [{ title: data?.campaign ? `New character — ${data.campaign.name}` : "New character — GM" }];
}

export default function CharacterNew() {
  const { campaign, suggestions } = useLoaderData() as Route.ComponentProps["loaderData"];
  const actionData = useActionData() as Route.ComponentProps["actionData"];
  const navigation = useNavigation();
  const submit = useSubmit();
  const error = actionData && typeof actionData === "object" && "error" in actionData ? (actionData as { error: string }).error : null;

  const handleSubmit = (data: CharacterFormData) => {
    const fd = new FormData();
    fd.set("name", data.name);
    fd.set("race", data.race ?? "");
    fd.set("className", data.className ?? "");
    fd.set("description", data.description ?? "");
    fd.set("skills", data.skills ?? "");
    fd.set("statistics", data.statistics ?? "");
    fd.set("items", data.items ?? "");
    submit(fd, { method: "post" });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="overline" component={Link} to={`/campaigns/${campaign.id}`} sx={{ textDecoration: "none" }}>
        {campaign.name}
      </Typography>
      <Typography variant="h5" sx={{ mt: 1 }}>New character</Typography>
      {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
      <Box sx={{ mt: 2 }}>
        <CharacterForm
          suggestions={suggestions}
          onSubmit={handleSubmit}
          submitting={navigation.state === "submitting"}
        />
      </Box>
    </Box>
  );
}

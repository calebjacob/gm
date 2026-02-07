import { Link, useLoaderData } from "react-router";
import { Box, Typography } from "@mui/material";
import type { Route } from "./+types/worlds.$id";

export async function loader({ params }: Route.LoaderArgs) {
  const { getDatabase } = await import("server/db");
  const { getCurrentUserId } = await import("server/auth");
  const db = getDatabase();
  const userId = getCurrentUserId();
  const row = db
    .prepare('SELECT "id", "name", "description", "coverImagePath" FROM "worlds" WHERE "id" = ? AND "userId" = ?')
    .get(params.id, userId) as { id: string; name: string; description: string | null; coverImagePath: string | null } | undefined;
  if (!row) throw new Response("Not Found", { status: 404 });
  const chunkCount = db.prepare('SELECT COUNT(*) as c FROM "worldChunks" WHERE "worldId" = ?').get(row.id) as { c: number };
  return { ...row, chunkCount: chunkCount.c };
}

export function meta({ data }: Route.MetaArgs): Route.MetaDescriptors {
  return [{ title: data ? `${data.name} — GM` : "World — GM" }];
}

export default function WorldDetail() {
  const data = useLoaderData() as Route.ComponentProps["loaderData"];
  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Typography variant="overline" component={Link} to="/worlds" sx={{ textDecoration: "none" }}>Worlds</Typography>
      <Typography variant="h4" sx={{ mt: 1 }}>{data.name}</Typography>
      {data.description && <Typography color="text.secondary" sx={{ mt: 1 }}>{data.description}</Typography>}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Chunks: {data.chunkCount}</Typography>
    </Box>
  );
}

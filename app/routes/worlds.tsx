import { Link, useLoaderData } from "react-router";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import { Plus } from "lucide-react";
import type { Route } from "./+types/worlds";

export async function loader() {
  const { getDatabase } = await import("server/db");
  const { getCurrentUserId } = await import("server/auth");
  const db = getDatabase();
  const userId = getCurrentUserId();
  const rows = db
    .prepare(
      'SELECT "id", "name", "description", "coverImagePath", "createdAt" FROM "worlds" WHERE "userId" = ? ORDER BY "updatedAt" DESC'
    )
    .all(userId) as { id: string; name: string; description: string | null; coverImagePath: string | null; createdAt: string }[];
  return { worlds: rows };
}

export function meta(): Route.MetaDescriptors {
  return [{ title: "Worlds — GM" }];
}

export default function Worlds() {
  const { worlds } = useLoaderData() as Route.ComponentProps["loaderData"];
  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4">Worlds</Typography>
        <Button component={Link} to="/worlds/new" variant="contained" startIcon={<Plus size={18} />}>
          New World
        </Button>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {worlds.length === 0 ? (
          <Typography color="text.secondary">No worlds yet. Create one from PDF/MD/TXT files.</Typography>
        ) : (
          worlds.map((w) => (
            <Card key={w.id} component={Link} to={`/worlds/${w.id}`} sx={{ textDecoration: "none", color: "inherit" }}>
              <CardContent>
                <Typography variant="h6">{w.name}</Typography>
                {w.description && <Typography variant="body2" color="text.secondary">{w.description}</Typography>}
              </CardContent>
            </Card>
          ))
        )}
      </Box>
    </Box>
  );
}

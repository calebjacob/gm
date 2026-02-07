import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import { Plus } from "lucide-react";
import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/rulesets";

export async function loader() {
  const { getDatabase } = await import("server/db");
  const { getCurrentUserId } = await import("server/auth");
  const db = getDatabase();
  const userId = getCurrentUserId();
  const rows = db
    .prepare(
      'SELECT "id", "name", "description", "coverImagePath", "createdAt" FROM "rulesets" WHERE "userId" = ? ORDER BY "updatedAt" DESC',
    )
    .all(userId) as {
    id: string;
    name: string;
    description: string | null;
    coverImagePath: string | null;
    createdAt: string;
  }[];
  return { rulesets: rows };
}

export function meta(): Route.MetaDescriptors {
  return [{ title: "Rulesets — GM" }];
}

export default function Rulesets() {
  const { rulesets } = useLoaderData<typeof loader>();

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4">Rulesets</Typography>
        <Button
          component={Link}
          to="/rulesets/new"
          variant="contained"
          startIcon={<Plus size={18} />}
        >
          New Ruleset
        </Button>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {rulesets.length === 0 ? (
          <Typography color="text.secondary">
            No rulesets yet. Create one from PDF/MD/TXT files.
          </Typography>
        ) : (
          rulesets.map((r) => (
            <Card
              key={r.id}
              component={Link}
              to={`/rulesets/${r.id}`}
              sx={{ textDecoration: "none", color: "inherit" }}
            >
              <CardContent>
                <Typography variant="h6">{r.name}</Typography>
                {r.description && (
                  <Typography variant="body2" color="text.secondary">
                    {r.description}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </Box>
    </Box>
  );
}

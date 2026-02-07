import { Box, Button, TextField, Typography } from "@mui/material";
import { Upload } from "lucide-react";
import { Link, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/rulesets.new";

export async function action({ request }: Route.ActionArgs) {
  const { getDatabase } = await import("server/db");
  const { getCurrentUserId } = await import("server/auth");
  const { chunkText } = await import("server/rag/chunk");
  const { ingestRulesetChunks } = await import("server/rag/ingest");
  const { generateNameAndDescription } = await import("server/llm");
  const { parseDocument } = await import("server/parse");
  const {
    saveUpload,
    validateDocumentFile,
    validateImageFile,
    getUploadRelPath,
    writeUpload,
  } = await import("server/upload");

  if (request.method !== "POST") return null;
  const formData = await request.formData();
  const documents = formData.getAll("documents") as File[];
  const cover = formData.get("cover") as File | null;

  if (!documents.length || !documents[0]?.size) {
    return { error: "Upload at least one document (PDF, MD, or TXT)." };
  }

  for (const f of documents) {
    const v = validateDocumentFile(f.name, f.size);
    if (!v.ok) return { error: v.message, status: v.status };
  }
  if (cover?.size) {
    const v = validateImageFile(cover.name, cover.size);
    if (!v.ok) return { error: v.message, status: v.status };
  }

  const db = getDatabase();
  const userId = getCurrentUserId();
  const rulesetId = crypto.randomUUID();
  const now = new Date().toISOString();

  let fullText = "";
  const sourceIds: {
    id: string;
    filePath: string;
    originalFileName: string;
    sortOrder: number;
  }[] = [];

  for (let i = 0; i < documents.length; i++) {
    const file = documents[i]!;
    const rel = await saveUpload(file);
    const ext = rel.slice(rel.lastIndexOf("."));
    const text = await parseDocument(rel, ext);
    fullText += (fullText ? "\n\n" : "") + text;
    const sourceId = crypto.randomUUID();
    sourceIds.push({
      id: sourceId,
      filePath: rel,
      originalFileName: file.name,
      sortOrder: i,
    });
  }

  const { name, description } = await generateNameAndDescription(fullText);

  let coverImagePath: string | null = null;
  if (cover?.size) {
    coverImagePath = getUploadRelPath(cover.name);
    await writeUpload(coverImagePath, await cover.arrayBuffer());
  }

  db.prepare(
    `INSERT INTO "rulesets" ("id", "userId", "name", "description", "coverImagePath", "createdAt", "updatedAt")
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(rulesetId, userId, name, description, coverImagePath, now, now);

  for (const s of sourceIds) {
    db.prepare(
      `INSERT INTO "rulesetSources" ("id", "rulesetId", "filePath", "originalFileName", "sortOrder", "createdAt")
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(s.id, rulesetId, s.filePath, s.originalFileName, s.sortOrder, now);
  }

  const chunks = chunkText(fullText);
  ingestRulesetChunks(rulesetId, chunks, sourceIds[0]?.id ?? null, db);

  throw redirect(`/rulesets/${rulesetId}`);
}

export function meta(): Route.MetaDescriptors {
  return [{ title: "New Ruleset — GM" }];
}

export default function RulesetsNew() {
  const actionData = useActionData() as Route.ComponentProps["actionData"];
  const navigation = useNavigation();
  const error =
    actionData && typeof actionData === "object" && "error" in actionData
      ? (actionData as { error: string }).error
      : null;
  const submitting = navigation.state === "submitting";

  return (
    <Box sx={{ p: 3, maxWidth: 500, mx: "auto" }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        New Ruleset
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Upload one or more documents (PDF, Markdown, or plain text). Name and
        description will be generated.
      </Typography>
      <form method="post" encType="multipart/form-data">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            type="file"
            name="documents"
            slotProps={{
              htmlInput: {
                accept: ".pdf,.md,.txt",
                multiple: true,
                required: true,
              },
            }}
            fullWidth
          />
          <TextField
            type="file"
            name="cover"
            label="Cover image (optional)"
            slotProps={{
              htmlInput: { accept: ".jpg,.jpeg,.png,.webp" },
            }}
            fullWidth
          />
          {error && <Typography color="error">{error}</Typography>}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={<Upload size={18} />}
            >
              {submitting ? "Creating…" : "Create Ruleset"}
            </Button>
            <Button component={Link} to="/rulesets">
              Cancel
            </Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
}

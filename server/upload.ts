import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const DOC_EXT = new Set([".pdf", ".md", ".txt"]);
const IMG_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const DOC_MAX = 100 * 1024 * 1024; // 100 MB
const IMG_MAX = 5 * 1024 * 1024;   // 5 MB

function sanitizeFileName(name: string): string {
  const base = path.basename(name).replace(/[^\w.\- ]/g, "").slice(0, 200);
  return base || "file";
}

export function isDocumentExt(ext: string): boolean {
  return DOC_EXT.has(ext.toLowerCase());
}

export function isImageExt(ext: string): boolean {
  return IMG_EXT.has(ext.toLowerCase());
}

export function validateDocumentFile(
  name: string,
  size: number
): { ok: true } | { ok: false; status: number; message: string } {
  const ext = path.extname(name).toLowerCase();
  if (!DOC_EXT.has(ext)) {
    return { ok: false, status: 400, message: "Invalid document type. Use .pdf, .md, or .txt" };
  }
  if (size > DOC_MAX) {
    return { ok: false, status: 413, message: "Document too large (max 100 MB)" };
  }
  return { ok: true };
}

export function validateImageFile(
  name: string,
  size: number
): { ok: true } | { ok: false; status: number; message: string } {
  const ext = path.extname(name).toLowerCase();
  if (!IMG_EXT.has(ext)) {
    return { ok: false, status: 400, message: "Invalid image type. Use .jpg, .jpeg, .png, or .webp" };
  }
  if (size > IMG_MAX) {
    return { ok: false, status: 413, message: "Image too large (max 5 MB)" };
  }
  return { ok: true };
}

export function getUploadRelPath(originalName: string, subdir: string = ""): string {
  const base = sanitizeFileName(originalName);
  const name = `${randomUUID()}_${base}`;
  return subdir ? path.join("uploads", subdir, name) : path.join("uploads", name);
}

export async function writeUpload(
  relPath: string,
  data: ArrayBuffer | Buffer
): Promise<void> {
  const full = path.join(process.cwd(), relPath);
  const dir = path.dirname(full);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(full, Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer));
}

export async function saveUpload(
  file: { name: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> },
  subdir: string = ""
): Promise<string> {
  const rel = getUploadRelPath(file.name, subdir);
  const buf = await file.arrayBuffer();
  await writeUpload(rel, buf);
  return rel;
}

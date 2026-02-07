import fs from "node:fs";
import path from "node:path";

export async function parseDocument(
  filePath: string,
  ext: string
): Promise<string> {
  const full = path.join(process.cwd(), filePath);
  const buf = fs.readFileSync(full);
  const lower = ext.toLowerCase();
  if (lower === ".pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await (pdfParse as (b: Buffer) => Promise<{ text: string }>)(buf);
    return data.text;
  }
  if (lower === ".md" || lower === ".txt") {
    return buf.toString("utf-8");
  }
  return buf.toString("utf-8");
}

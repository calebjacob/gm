export interface Chunk {
  content: string;
  sectionLabel?: string;
}

const MAX_CHARS = 600;
const OVERLAP_CHARS = 100;

function splitOnSections(text: string): { content: string; sectionLabel?: string }[] {
  const chunks: { content: string; sectionLabel?: string }[] = [];
  const lines = text.split(/\r?\n/);
  let currentSection = "";
  let currentLabel: string | undefined;
  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (currentSection.trim()) {
        chunks.push({ content: currentSection.trim(), sectionLabel: currentLabel });
      }
      currentLabel = headingMatch[2]!.trim();
      currentSection = line + "\n";
    } else {
      currentSection += line + "\n";
    }
  }
  if (currentSection.trim()) {
    chunks.push({ content: currentSection.trim(), sectionLabel: currentLabel });
  }
  return chunks;
}

function splitIntoSmallChunks(
  content: string,
  sectionLabel?: string
): { content: string; sectionLabel?: string }[] {
  if (content.length <= MAX_CHARS) {
    return [{ content, sectionLabel }];
  }
  const result: { content: string; sectionLabel?: string }[] = [];
  let start = 0;
  while (start < content.length) {
    let end = Math.min(start + MAX_CHARS, content.length);
    if (end < content.length) {
      const lastSpace = content.lastIndexOf(" ", end);
      if (lastSpace > start) end = lastSpace;
    }
    result.push({ content: content.slice(start, end).trim(), sectionLabel });
    start = end - (end < content.length ? OVERLAP_CHARS : 0);
  }
  return result;
}

export function chunkText(text: string): Chunk[] {
  const sections = splitOnSections(text);
  const chunks: Chunk[] = [];
  for (const s of sections) {
    chunks.push(...splitIntoSmallChunks(s.content, s.sectionLabel));
  }
  return chunks.filter((c) => c.content.length > 0);
}

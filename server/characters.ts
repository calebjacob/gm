const AT_MENTION = /@(\w+(?:\s+\w+)*)/g;

export interface CharacterRef {
  characterId: string;
  name: string;
}

export function resolveCharacterReferences(
  content: string,
  characters: { id: string; name: string }[]
): CharacterRef[] {
  const seen = new Set<string>();
  const refs: CharacterRef[] = [];
  let m: RegExpExecArray | null;
  AT_MENTION.lastIndex = 0;
  while ((m = AT_MENTION.exec(content)) !== null) {
    const name = m[1]!.trim();
    if (seen.has(name)) continue;
    seen.add(name);
    const char = characters.find((c) => c.name === name);
    if (char) refs.push({ characterId: char.id, name: char.name });
  }
  return refs;
}

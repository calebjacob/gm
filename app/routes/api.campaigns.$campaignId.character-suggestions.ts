export async function loader({
  params,
}: {
  params: { campaignId: string };
}) {
  const { getDatabase } = await import("server/db");
  const { getCurrentUserId } = await import("server/auth");
  const { retrieve } = await import("server/rag/retrieve");
  const db = getDatabase();
  const userId = getCurrentUserId();
  const campaign = db
    .prepare('SELECT "rulesetId", "worldId" FROM "campaigns" WHERE "id" = ? AND "userId" = ?')
    .get(params.campaignId, userId) as { rulesetId: string; worldId: string } | undefined;
  if (!campaign) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }
  const { rulesContext, campaignContext } = retrieve(
    "races classes skills statistics items character options",
    campaign.rulesetId,
    campaign.worldId,
    8,
    db
  );
  const text = (rulesContext + "\n\n" + campaignContext).slice(0, 4000);
  const races: string[] = [];
  const classes: string[] = [];
  const skills: string[] = [];
  const items: string[] = [];
  const rMatch = text.match(/\b(race[s]?|races?)\s*[:\-]\s*([^\n.]+)/gi);
  if (rMatch) {
    const part = rMatch[0]?.split(/[,\-;]/) ?? [];
    part.forEach((p) => p.trim() && races.push(p.trim()));
  }
  const cMatch = text.match(/\b(class(?:es)?|classes?)\s*[:\-]\s*([^\n.]+)/gi);
  if (cMatch) {
    const part = cMatch[0]?.split(/[,\-;]/) ?? [];
    part.forEach((p) => p.trim() && classes.push(p.trim()));
  }
  return Response.json({
    races: races.length ? races : ["Human", "Elf", "Dwarf"],
    classes: classes.length ? classes : ["Fighter", "Wizard", "Cleric"],
    skills: skills.length ? skills : [],
    items: items.length ? items : [],
  });
}

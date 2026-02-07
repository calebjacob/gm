import { getConfig } from "./config/env.js";
import { getDatabase } from "./db/index.js";

export function getCurrentUserId(): string {
  const config = getConfig();
  if (config.DEFAULT_USER_ID) return config.DEFAULT_USER_ID;
  const db = getDatabase();
  const row = db.prepare('SELECT "id" FROM "users" LIMIT 1').get() as { id: string } | undefined;
  if (!row) throw new Error("No user in database");
  return row.id;
}

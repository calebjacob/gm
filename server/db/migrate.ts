import type Database from "better-sqlite3";
import * as m1 from "./migrations/0001-initial-schema";
import * as m2 from "./migrations/0002-vec-tables";

const migrations = [
  { version: m1.version, up: m1.up },
  { version: m2.version, up: m2.up },
].sort((a, b) => a.version - b.version);

export function runMigrations(db: Database.Database): void {
  const row = db.prepare("PRAGMA user_version").get() as { user_version: number };
  let currentVersion = row.user_version;
  for (const m of migrations) {
    if (m.version <= currentVersion) continue;
    const run = db.transaction(() => {
      m.up(db);
      db.prepare(`PRAGMA user_version = ${m.version}`).run();
    });
    run();
    currentVersion = m.version;
  }
}

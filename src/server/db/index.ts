import fs from "node:fs";
import path, { dirname } from "node:path";
import { createClient } from "@libsql/client";
import { serverEnv } from "@/server/env";
import { migrateDatabaseServer } from "./migrate";
import { seedDatabaseServer } from "./seed";

const DATABASE_PATH = path.join(process.cwd(), serverEnv.DATABASE_PATH);

if (!fs.existsSync(DATABASE_PATH)) {
	fs.mkdirSync(dirname(DATABASE_PATH), { recursive: true });
	fs.writeFileSync(DATABASE_PATH, "");
}

export const db = createClient({
	url: `file:${DATABASE_PATH}`,
});

await migrateDatabaseServer(db);
await seedDatabaseServer(db);

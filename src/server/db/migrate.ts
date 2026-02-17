import fs from "node:fs";
import path from "node:path";
import type { Client } from "@libsql/client";
import { createServerOnlyFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverEnv } from "../env";

export const migrateDatabaseServer = createServerOnlyFn(async (db: Client) => {
	const rowQuery = await db.execute("PRAGMA user_version");
	const currentVersion = z.number().parse(rowQuery.rows[0][0]);

	const files = fs.globSync(
		path.join(process.cwd(), "src/server/db/migrations/*.sql"),
	);

	for (const sqlFilePath of files) {
		try {
			const migrationName = path.basename(sqlFilePath);
			const migrationVersion = Math.ceil(Number(migrationName.split("-")[0]));
			if (migrationVersion <= currentVersion) continue;

			const sql = fs.readFileSync(sqlFilePath, "utf8");

			const sqlWithInjectedConfig = sql.replace(
				`"embedding" F32_BLOB(0)`,
				`"embedding" F32_BLOB(${serverEnv.EMBEDDING_DIMENSION})`,
			);

			await db.executeMultiple(sqlWithInjectedConfig);

			await db.execute({
				sql: `PRAGMA user_version = ${migrationVersion}`,
			});
		} catch (error) {
			console.error(`Database migration failed: ${sqlFilePath}`);
			throw error;
		}
	}
});

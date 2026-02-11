import fs from "node:fs";
import path, { dirname } from "node:path";
import { type Client, createClient } from "@libsql/client";
import { z } from "zod";
import { serverEnv } from "@/server/env";
import { runMigrations } from "./migrate";

let db: Client | null = null;
const DATABASE_PATH = path.join(process.cwd(), serverEnv.DATABASE_PATH);

export function getDb(): Client {
	if (db) return db;

	// if (fs.existsSync(DATABASE_PATH)) {
	// 	console.error("!!! Removing database file !!!");
	// 	fs.rmSync(DATABASE_PATH);
	// }

	if (!fs.existsSync(DATABASE_PATH)) {
		fs.mkdirSync(dirname(DATABASE_PATH), { recursive: true });
		fs.writeFileSync(DATABASE_PATH, "");
	}

	db = createClient({
		url: `file:${DATABASE_PATH}`,
	});

	initialize(db);

	return db;
}

async function initialize(db: Client) {
	try {
		await runMigrations(db);

		const userCountQuery = await db.execute({
			sql: 'SELECT COUNT(*) as c FROM "users"',
		});

		const userCount = z.number().parse(userCountQuery.rows[0][0]);

		if (userCount === 0) {
			const now = new Date().toISOString();
			await db.execute({
				sql: `INSERT INTO "users" ("id", "email", "name", "createdAt", "updatedAt") VALUES ($id, $email, $name, $createdAt, $updatedAt)`,
				args: {
					id: serverEnv.DEFAULT_USER_ID,
					email: serverEnv.DEFAULT_USER_EMAIL,
					name: serverEnv.DEFAULT_USER_NAME,
					createdAt: now,
					updatedAt: now,
				},
			});
		}
	} catch (error) {
		console.error("Failed to initialize database:", error);
	}
}

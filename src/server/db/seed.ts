import type { Client } from "@libsql/client";
import { createServerOnlyFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverEnv } from "@/server/env";

export const seedDatabaseServer = createServerOnlyFn(async (db: Client) => {
	try {
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
		console.error("Failed to seed database:", error);
	}
});

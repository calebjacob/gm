import fs from "node:fs/promises";
import path from "node:path";
import { createServerOnlyFn } from "@tanstack/react-start";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export const uploadFileServer = createServerOnlyFn(async (file: File) => {
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-_]/g, "");
	const fileName = `${crypto.randomUUID()}-${sanitizedFileName}`;

	console.error("!!! Removing upload directory !!!");
	await fs.rm(UPLOAD_DIR, { recursive: true });

	await fs.mkdir(UPLOAD_DIR, { recursive: true });
	await fs.writeFile(path.join(UPLOAD_DIR, fileName), buffer);

	return { fileName };
});

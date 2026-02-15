import fs from "node:fs/promises";
import path from "node:path";
import { createServerOnlyFn } from "@tanstack/react-start";
import { serverEnv } from "@/server/env";

const UPLOADS_PATH = path.join(process.cwd(), serverEnv.UPLOADS_PATH);

export const uploadFileBufferServer = createServerOnlyFn(
	async (buffer: Buffer<ArrayBuffer>, fileName: string) => {
		const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-_]/g, "");
		const filePath = `${crypto.randomUUID()}-${sanitizedFileName}`;

		await fs.mkdir(UPLOADS_PATH, { recursive: true });
		await fs.writeFile(path.join(UPLOADS_PATH, filePath), buffer);

		return { filePath };
	},
);

export const uploadFileServer = createServerOnlyFn(async (file: File) => {
	const arrayBuffer = await file.arrayBuffer();
	return uploadFileBufferServer(Buffer.from(arrayBuffer), file.name);
});

import fs from "node:fs/promises";
import path from "node:path";
import { createServerOnlyFn } from "@tanstack/react-start";
import { PDFParse } from "pdf-parse";

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

export const readTextFileServer = createServerOnlyFn(async (file: File) => {
	if (file.type === "application/pdf") {
		return readPdfFileServer(file);
	}

	const text = await file.text();

	return text;
});

export const readPdfFileServer = createServerOnlyFn(async (file: File) => {
	const arrayBuffer = await file.arrayBuffer();
	const parser = new PDFParse({ data: arrayBuffer, useSystemFonts: true });

	const result = await parser.getText({
		parsePageInfo: true,
	});

	console.log(result.pages[0]);
	console.log(result.pages[1]);
	console.log(result.pages[2]);

	await parser.destroy();

	return result;
});

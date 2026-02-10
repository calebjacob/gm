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

type ReadTextFileResult = {
	pages: {
		pageNumber: number;
		chunks: string[];
	}[];
};

const splitTextIntoChunks = (text: string, wordsPerChunk: number) => {
	const words = text.split(/\s+/);
	const chunks = [];
	for (let i = 0; i < words.length; i += wordsPerChunk) {
		chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
	}
	return chunks;
};

const wordsPerChunk = 300;

export const readTextFileServer = createServerOnlyFn(
	async (file: File): Promise<ReadTextFileResult> => {
		if (file.type === "application/pdf") {
			return readPdfFileServer(file);
		}

		const text = await file.text();

		return {
			pages: [
				{
					pageNumber: 1,
					chunks: splitTextIntoChunks(text, wordsPerChunk),
				},
			],
		};
	},
);

export const readPdfFileServer = createServerOnlyFn(
	async (file: File): Promise<ReadTextFileResult> => {
		const arrayBuffer = await file.arrayBuffer();
		const parser = new PDFParse({ data: arrayBuffer, useSystemFonts: true });

		const result = await parser.getText({
			parsePageInfo: true,
		});

		await parser.destroy();

		return {
			pages: result.pages.map((page) => ({
				pageNumber: page.num,
				chunks: splitTextIntoChunks(page.text, wordsPerChunk),
			})),
		};
	},
);

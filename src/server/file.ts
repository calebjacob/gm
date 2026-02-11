import fs from "node:fs/promises";
import path from "node:path";
import { createServerOnlyFn } from "@tanstack/react-start";
import { PDFParse } from "pdf-parse";
import { serverEnv } from "@/server/env";

const UPLOADS_PATH = path.join(process.cwd(), serverEnv.UPLOADS_PATH);

export const uploadFileServer = createServerOnlyFn(async (file: File) => {
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-_]/g, "");
	const filePath = `${crypto.randomUUID()}-${sanitizedFileName}`;

	console.error("!!! Removing uploads directory !!!");
	await fs.rm(UPLOADS_PATH, { recursive: true });
	await fs.mkdir(UPLOADS_PATH, { recursive: true });
	await fs.writeFile(path.join(UPLOADS_PATH, filePath), buffer);

	return { filePath };
});

type ReadTextFileResult = {
	chunks: {
		pageNumber: number;
		text: string;
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

		const chunks = splitTextIntoChunks(text, wordsPerChunk).map((text) => ({
			pageNumber: 1,
			text,
		}));

		return {
			chunks,
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

		const chunks = result.pages.flatMap((page) =>
			splitTextIntoChunks(page.text, wordsPerChunk).map((text) => ({
				pageNumber: page.num,
				text,
			})),
		);

		return {
			chunks,
		};
	},
);

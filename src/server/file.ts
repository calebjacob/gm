import fs from "node:fs/promises";
import path from "node:path";
import { createServerOnlyFn } from "@tanstack/react-start";
import { PDFParse } from "pdf-parse";
import { serverEnv } from "@/server/env";

// import { createWorker, PSM } from "tesseract.js";

const UPLOADS_PATH = path.join(process.cwd(), serverEnv.UPLOADS_PATH);

export const uploadFileFromBufferServer = createServerOnlyFn(
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
	return uploadFileFromBufferServer(Buffer.from(arrayBuffer), file.name);
});

type ReadTextFileResult = {
	chunks: {
		content: string;
		pageNumber: number;
	}[];
	coverImagePath?: string;
};

const SENTENCE_ENDINGS = /[.!?]$/;

const splitTextIntoChunks = (text: string, wordsPerChunk: number) => {
	const words = text.split(" ").filter(Boolean);
	const chunks: string[] = [];
	let i = 0;

	while (i < words.length) {
		let end = Math.min(i + wordsPerChunk, words.length);

		// Prefer splitting at sentence boundaries to avoid breaking mid-sentence
		if (end < words.length) {
			let lastSentenceEnd = -1;
			for (let j = end - 1; j >= i; j--) {
				if (SENTENCE_ENDINGS.test(words[j])) {
					lastSentenceEnd = j;
					break;
				}
			}
			if (lastSentenceEnd >= i) {
				end = lastSentenceEnd + 1;
			}
		}

		chunks.push(words.slice(i, end).join(" "));
		i = end;
	}

	return chunks;
};

const wordsPerChunk = 500;

export const readTextFileServer = createServerOnlyFn(
	async (file: File): Promise<ReadTextFileResult> => {
		if (file.type === "application/pdf") {
			return readPdfFileServer(file);
		}

		const text = await file.text();

		const chunks = splitTextIntoChunks(text, wordsPerChunk).map((content) => ({
			pageNumber: 1,
			content,
		}));

		return {
			chunks,
		};
	},
);

export const readPdfFileServer = createServerOnlyFn(
	async (file: File): Promise<ReadTextFileResult> => {
		const chunks: ReadTextFileResult["chunks"] = [];
		const arrayBuffer = await file.arrayBuffer();
		const parser = new PDFParse({
			data: arrayBuffer,
			useSystemFonts: true,
		});

		const pdfParserTextResult = await parser.getText({
			parsePageInfo: true,
		});

		for (const page of pdfParserTextResult.pages) {
			const pageChunks = splitTextIntoChunks(page.text, wordsPerChunk).map(
				(content) => ({
					pageNumber: page.num,
					content,
				}),
			);

			chunks.push(...pageChunks);
		}

		const pdfParserScreenshotResult = await parser.getScreenshot({
			partial: [1],
			scale: 2,
		});

		const image = Buffer.from(pdfParserScreenshotResult.pages[0].data);
		const { filePath: coverImagePath } = await uploadFileFromBufferServer(
			image,
			"screenshot.png",
		);

		await parser.destroy();

		// const pdfParserResult = await parser.getScreenshot({
		// 	parsePageInfo: true,
		// 	partial: [1, 2, 3],
		// 	scale: 3,
		// });

		// const worker = await createWorker("eng");

		// await worker.setParameters({
		// 	// https://github.com/tesseract-ocr/tesseract/blob/4.0.0/src/ccstruct/publictypes.h#L163
		// 	tessedit_pageseg_mode: PSM.AUTO,
		// 	preserve_interword_spaces: "1",
		// });

		// for (const page of pdfParserResult.pages) {
		// 	const tesseractResult = await worker.recognize(
		// 		Buffer.from(page.data),
		// 	);
		// 	chunks.push({
		// 		pageNumber: page.pageNumber,
		// 		content: tesseractResult.data.text,
		// 		pageScreenshotDataUrl: page.dataUrl,
		// 	});
		// }

		// await worker.terminate();
		// await parser.destroy();

		return {
			chunks,
			coverImagePath,
		};
	},
);

import { createServerOnlyFn } from "@tanstack/react-start";
import { PDFParse } from "pdf-parse";
import { splitTextIntoChunks } from "./chunk";
import { uploadFileBufferServer } from "./upload";

// import { createWorker, PSM } from "tesseract.js";

type ReadTextFileResult = {
	chunks: {
		content: string;
		pageNumber: number;
	}[];
	coverImagePath?: string;
};

const wordsPerChunk = 500;
const overlapWordsPerChunk = 100;

export const readTextFileServer = createServerOnlyFn(
	async (file: File): Promise<ReadTextFileResult> => {
		if (file.type === "application/pdf") {
			return readPdfFile(file);
		}

		if (file.type === "text/plain" || file.type === "text/markdown") {
			const text = await file.text();

			const chunks = splitTextIntoChunks({
				text,
				wordsPerChunk,
				overlapWordsPerChunk,
			}).map((content) => ({
				pageNumber: 1,
				content,
			}));

			return {
				chunks,
			};
		}

		throw new Error(`Unsupported file type: ${file.type}`);
	},
);

async function readPdfFile(file: File): Promise<ReadTextFileResult> {
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
		const pageChunks = splitTextIntoChunks({
			text: page.text,
			wordsPerChunk,
			overlapWordsPerChunk,
		}).map((content) => ({
			pageNumber: page.num,
			content,
		}));

		chunks.push(...pageChunks);
	}

	const pdfParserScreenshotResult = await parser.getScreenshot({
		partial: [1],
		scale: 2,
	});

	const image = Buffer.from(pdfParserScreenshotResult.pages[0].data);
	const { filePath: coverImagePath } = await uploadFileBufferServer(
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
}

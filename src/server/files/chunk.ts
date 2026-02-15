const SENTENCE_ENDINGS = /[.!?]$/;

export const splitTextIntoChunks = ({
	text,
	wordsPerChunk,
	overlapWordsPerChunk,
}: {
	text: string;
	wordsPerChunk: number;
	overlapWordsPerChunk: number;
}) => {
	const words = text.split(" ").filter(Boolean);
	const chunks: string[] = [];
	let i = 0;

	while (i < words.length) {
		const start = Math.max(i - overlapWordsPerChunk, 0);
		let end = Math.min(start + wordsPerChunk, words.length);

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

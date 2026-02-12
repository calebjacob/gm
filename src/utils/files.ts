export function formatFileType(mimeType: string) {
	// application/pdf -> pdf
	// text/markdown -> markdown
	// text/plain -> txt
	// image/* -> image
	// image/png -> png
	const [type = "unknown", subtype = "unknown"] = mimeType.split("/");
	if (subtype === "*") return type;
	if (mimeType === "text/plain") return "txt";
	return subtype;
}

export function fullPathToUploadedFile(filePath: string) {
	return `/uploads/${filePath}`;
}

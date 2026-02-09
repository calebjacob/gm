export function formatBytes(bytes: number) {
	const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
	const index = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${(bytes / 1024 ** index).toFixed(2)} ${units[index]}`;
}

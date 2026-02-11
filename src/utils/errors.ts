import { toastQueue } from "@/components/lib/Toast";

export function handleClientError(
	error: unknown,
	options: Partial<{ title: string }> = {},
) {
	console.error(error);

	const message =
		error instanceof Error ? error.message : "An unknown error occurred";

	toastQueue.add({
		title: options.title || "Oops!",
		description: message,
		type: "error",
	});
}

export function toClientErrorMessage(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}

	return "An unknown error occurred";
}

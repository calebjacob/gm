import { UploadIcon } from "lucide-react";
import { useRef } from "react";
import {
	DropZone as AriaDropZone,
	type DropZoneProps as AriaDropZoneProps,
} from "react-aria-components";
import { formatBytes } from "@/utils/bytes";
import { MAX_FILE_SIZE } from "@/utils/constants";
import { formatFileType } from "@/utils/files";
import { Badge } from "./Badge";
import styles from "./FileSelect.module.css";
import { Icon } from "./Icon";
import { Row } from "./Row";
import { Text } from "./Text";
import { DEFAULT_TOAST_OPTIONS, toastQueue } from "./Toast";
import { VisuallyHidden } from "./VisuallyHidden";

export function FileSelect({
	accept,
	maxFileSize = MAX_FILE_SIZE,
	multiple = false,
	...props
}: {
	accept: ("text/plain" | "text/markdown" | "application/pdf" | "image/*")[];
	maxFileSize?: number;
	multiple?: boolean;
	onSelectFiles: (files: File[]) => void;
}) {
	const elementRef = useRef<HTMLLabelElement>(null);

	const onSelectFiles = (files: FileList | File[] | null) => {
		if (!files) return;

		const validFiles: File[] = [];

		for (const file of files) {
			if (!accept.some((t) => file.type.startsWith(t.replace("/*", "/")))) {
				toastQueue.add(
					{
						title: file.name,
						description: `Invalid file type: ${formatFileType(file.type)}. Allowed file types: ${accept.map(formatFileType).join(", ")}`,
						type: "error",
					},
					DEFAULT_TOAST_OPTIONS,
				);
				continue;
			}

			if (file.size > maxFileSize) {
				toastQueue.add(
					{
						title: file.name,
						description: `File is too large: ${formatBytes(file.size)}. Max allowed file size: ${formatBytes(maxFileSize)}`,
						type: "error",
					},
					DEFAULT_TOAST_OPTIONS,
				);
				continue;
			}

			validFiles.push(file);
		}

		if (validFiles.length > 0) {
			props.onSelectFiles(validFiles);
		}
	};

	const onDrop: AriaDropZoneProps["onDrop"] = async (event) => {
		const promises = event.items.map(async (item) => {
			if (item.kind !== "file") return;
			const file = await item.getFile();
			return file;
		});

		const files = (await Promise.all(promises)).filter((file) => !!file);

		onSelectFiles(files);
	};

	return (
		<AriaDropZone
			getDropOperation={() => "copy" as const}
			onDrop={onDrop}
			className={styles.fileSelect}
		>
			<label ref={elementRef}>
				<VisuallyHidden>
					<input
						type="file"
						multiple={multiple}
						accept={accept.join(",")}
						onChange={(event) => onSelectFiles(event.target.files)}
					/>
				</VisuallyHidden>

				<Icon size={1.5} color="muted">
					<UploadIcon />
				</Icon>

				<Text>Drag & drop or select files</Text>

				<Row align="center" gap={0.5} wrap>
					{accept.map((type) => (
						<Badge key={type}>{formatFileType(type)}</Badge>
					))}
				</Row>
			</label>
		</AriaDropZone>
	);
}

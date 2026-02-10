import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { PencilRulerIcon } from "lucide-react";
import { PDFParse } from "pdf-parse";
import { useState } from "react";
import { z } from "zod";
import { FileSelect } from "@/components/lib/FileSelect";
import { Icon } from "@/components/lib/Icon";
import { Row } from "@/components/lib/Row";
import { Section } from "@/components/lib/Section";
import { Stack } from "@/components/lib/Stack";
import { Text } from "@/components/lib/Text";
import { toastQueue } from "@/components/lib/Toast";
import { readTextFileServer, uploadFileServer } from "@/server/file";
import { toRouteTitle } from "@/utils/route-title";

const createModuleServer = createServerFn({
	method: "POST",
})
	.inputValidator((data) => {
		const formData = z.instanceof(FormData).parse(data);

		return z
			.object({
				file: z.instanceof(File),
			})
			.parse({
				file: formData.get("file"),
			});
	})
	.handler(async ({ data }) => {
		const { fileName } = await uploadFileServer(data.file);
		const text = await readTextFileServer(data.file);

		return { success: true, fileName };
	});

export const Route = createFileRoute("/modules/")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{
				title: toRouteTitle("Modules"),
			},
		],
	}),
});

function RouteComponent() {
	const [processingFiles, setProcessingFiles] = useState<File[]>([]);

	const createModule = useServerFn(createModuleServer);

	const handleSelectedFiles = async (files: File[]) => {
		setProcessingFiles((prev) => [...prev, ...files]);

		for (const file of files) {
			const formData = new FormData();
			formData.append("file", file);

			try {
				await createModule({
					data: formData,
				});
			} catch (error) {
				console.error(error);
				toastQueue.add({
					title: file.name,
					description: "Failed to create module",
					type: "error",
				});
			}
		}
	};

	return (
		<Section>
			<Section.Container>
				<Stack gap={0.5}>
					<Row align="center" gap={0.5}>
						<Icon color="muted" size={1.25}>
							<PencilRulerIcon />
						</Icon>
						<Text tag="h1" size="xl" family="gothic" color="muted" weight={300}>
							Modules
						</Text>
					</Row>

					<Text size="lg">
						Rulesets, worlds, lore, and adventures that power your campaigns
					</Text>
				</Stack>

				<FileSelect
					accept={["text/plain", "text/markdown", "application/pdf"]}
					onSelectFiles={handleSelectedFiles}
				/>
			</Section.Container>
		</Section>
	);
}

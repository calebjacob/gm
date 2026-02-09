import { createFileRoute } from "@tanstack/react-router";
import { PencilRulerIcon } from "lucide-react";
import { useState } from "react";
import { FileSelect } from "@/components/lib/FileSelect";
import { Icon } from "@/components/lib/Icon";
import { Row } from "@/components/lib/Row";
import { Section } from "@/components/lib/Section";
import { Stack } from "@/components/lib/Stack";
import { Text } from "@/components/lib/Text";
import { toRouteTitle } from "@/utils/route-title";

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

	const handleSelectedFiles = async (files: File[]) => {
		setProcessingFiles((prev) => [...prev, ...files]);

		for (const file of files) {
			const formData = new FormData();
			formData.append("file", file);
			// TODO
			// const response = await fetch("/api/modules", {
			// 	method: "POST",
			// 	body: formData,
			// });
			// const data = await response.json();
			// console.log(data);
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

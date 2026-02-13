import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { BookPlusIcon, PencilRulerIcon } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Badge } from "@/components/lib/Badge";
import { Card } from "@/components/lib/Card";
import { FileSelect } from "@/components/lib/FileSelect";
import { Icon } from "@/components/lib/Icon";
import { Progress } from "@/components/lib/Progress";
import { Row } from "@/components/lib/Row";
import { Section } from "@/components/lib/Section";
import { Stack } from "@/components/lib/Stack";
import { Text } from "@/components/lib/Text";
import { ThumbnailImage } from "@/components/lib/ThumbnailImage";
import { DEFAULT_TOAST_OPTIONS, toastQueue } from "@/components/lib/Toast";
import { QueryTest } from "@/components/QueryTest";
import type { CampaignSchema } from "@/schemas/campaign";
import { moduleSchema } from "@/schemas/module";
import { getCurrentUserId } from "@/server/auth";
import { getDb } from "@/server/db";
import { handleClientError } from "@/utils/errors";
import { fullPathToUploadedFile } from "@/utils/files";
import { toRouteTitle } from "@/utils/route-title";

const createCampaignServer = createServerFn({
	method: "POST",
})
	.inputValidator(
		z.object({
			name: z.string(),
			description: z.string().nullish(),
			moduleIds: z.array(z.string()),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const db = getDb();

			const campaign: CampaignSchema = {
				id: crypto.randomUUID(),
				userId: getCurrentUserId(),
				name: data.name,
				description: data.description,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			await db.execute({
				sql: `
				INSERT INTO "campaigns" ("id", "userId", "name", "description", "coverImagePath", "createdAt", "updatedAt")
				VALUES ($id, $userId, $name, $description, $coverImagePath, $createdAt, $updatedAt)
			`,
				args: {
					id: campaign.id,
					userId: campaign.userId,
					name: campaign.name,
					description: campaign.description || null,
					coverImagePath: campaign.coverImagePath || null,
					createdAt: campaign.createdAt.toISOString(),
					updatedAt: campaign.updatedAt.toISOString(),
				},
			});

			for (const moduleId of data.moduleIds) {
				await db.execute({
					sql: `
						INSERT INTO "campaignsModules" ("id", "campaignId", "moduleId")
						VALUES ($id, $campaignId, $moduleId)
					`,
					args: {
						id: crypto.randomUUID(),
						campaignId: campaign.id,
						moduleId,
					},
				});
			}

			return { campaign };
		} catch (error) {
			console.error(error);
			throw new Error("Failed to create campaign");
		}
	});

const getResourcesServer = createServerFn({
	method: "GET",
}).handler(async () => {
	const db = getDb();

	const modulesQuery = await db.execute({
		sql: `
				SELECT
					id,
					"userId",
					category,
					name,
					description,
					"coverImagePath",
					"contentFilePath",
					"createdAt",
					"updatedAt"
				FROM "modules"
				WHERE "userId" = $userId
				ORDER BY "name" ASC
			`,
		args: {
			userId: getCurrentUserId(),
		},
	});

	const modules = moduleSchema.array().parse(modulesQuery.rows);

	return { modules };
});

export const Route = createFileRoute("/campaigns/new")({
	component: RouteComponent,
	loader: () => getResourcesServer(),
	head: () => ({
		meta: [
			{
				title: toRouteTitle("New Campaign"),
			},
		],
	}),
});

function RouteComponent() {
	const router = useRouter();
	const data = Route.useLoaderData();
	const createCampaign = useServerFn(createCampaignServer);

	const [name, setName] = useState("");
	const [moduleIds, setModuleIds] = useState<string[]>([]);

	const submit = async () => {
		try {
			const { campaign } = await createCampaign({ data: { name, moduleIds } });

			toastQueue.add(
				{
					title: "Campaign created",
					description: name,
					type: "success",
				},
				DEFAULT_TOAST_OPTIONS,
			);

			router.navigate({ to: "/campaigns/$id", params: { id: campaign.id } });
		} catch (error) {
			handleClientError(error, {
				title: "Failed to create campaign",
			});
		}
	};

	return (
		<Section>
			<Section.Container>
				<Stack gap={0.5}>
					<Row align="center" gap={0.5}>
						<Icon color="muted" size={1.25}>
							<BookPlusIcon />
						</Icon>
						<Text tag="h1" size="xl" family="gothic" color="muted" weight={300}>
							Start a new campaign
						</Text>
					</Row>

					<Text size="lg">
						Select the modules that will define the rules and world for your
						next adventure.
					</Text>
				</Stack>

				<input
					type="text"
					placeholder="Name"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>

				<select
					multiple={true}
					value={moduleIds}
					onChange={(e) =>
						setModuleIds(
							Array.from(e.target.selectedOptions).map(
								(option) => option.value,
							),
						)
					}
				>
					{data.modules.map((module) => (
						<option key={module.id} value={module.id}>
							{module.name}
						</option>
					))}
				</select>

				<button type="button" onClick={submit}>
					Create Campaign
				</button>
			</Section.Container>
		</Section>
	);
}

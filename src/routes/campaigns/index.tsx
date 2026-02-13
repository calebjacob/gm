import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { BookOpenTextIcon } from "lucide-react";
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
import { toastQueue } from "@/components/lib/Toast";
import { QueryTest } from "@/components/QueryTest";
import type { CampaignSchema } from "@/schemas/campaign";
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
				moduleIds: data.moduleIds,
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

			return { campaign };
		} catch (error) {
			console.error(error);
			throw new Error("Failed to create campaign");
		}
	});

const getCampaignsServer = createServerFn({
	method: "GET",
}).handler(async () => {
	const db = getDb();

	const campaignsQuery = await db.execute({
		sql: `
			SELECT
				c."id",
				c."userId",
				c.name,
				c.description,
				c."coverImagePath",
				c."createdAt",
				c."updatedAt",
				m."id" AS "moduleId",
				m.name AS "moduleName",
				m.description AS "moduleDescription",
				m.category AS "moduleCategory",
				m."coverImagePath" AS "moduleCoverImagePath",
				m."contentFilePath" AS "moduleContentFilePath",
				m."createdAt" AS "moduleCreatedAt",
				m."updatedAt" AS "moduleUpdatedAt"
			FROM
					"campaigns" AS c
			INNER JOIN
					"campaignsModules" AS cm ON c.id = cm."campaignId"
			INNER JOIN
					"modules" AS m ON cm."moduleId" = m.id
			WHERE
					c."userId" = $userId
		`,
		args: {
			userId: getCurrentUserId(),
		},
	});

	console.log(campaignsQuery.rows);

	return { campaigns: [] };
});

export const Route = createFileRoute("/campaigns/")({
	component: RouteComponent,
	loader: () => getCampaignsServer(),
	head: () => ({
		meta: [
			{
				title: toRouteTitle("Campaigns"),
			},
		],
	}),
});

function RouteComponent() {
	const router = useRouter();
	const data = Route.useLoaderData();

	return (
		<Section>
			<Section.Container>
				<Stack gap={0.5}>
					<Row align="center" gap={1}>
						<Icon color="muted" size={1.5}>
							<BookOpenTextIcon />
						</Icon>

						<Text tag="h1" size="xl" family="gothic" color="muted" weight={300}>
							Campaigns
						</Text>

						<Text size="md">
							<Text.Link to="/campaigns/new">New Campaign</Text.Link>
						</Text>
					</Row>

					<Text size="lg">All of your adventures</Text>
				</Stack>

				{data.campaigns.map((campaign) => (
					<Card padding={1} gap={1}>
						{/* <Row align="center" gap={1}>
							<ThumbnailImage
								src={
									module.coverImagePath
										? fullPathToUploadedFile(module.coverImagePath)
										: null
								}
								alt={module.name}
								placeholder={<PencilRulerIcon size={16} />}
								aspectRatio="3 / 4"
								size={4}
							/>

							<Stack gap={0.5}>
								<Text tag="h3" size="xl" family="gothic">
									{module.name}
								</Text>

								<Text size="sm" color="muted">
									{module.id}
								</Text>

								<Row gap={0.5}>
									<Badge uppercase>{module.category}</Badge>
									<Badge>{module.moduleChunks.length} Chunks</Badge>
									<Badge>{module.moduleChunks.at(-1)?.pageNumber} Pages</Badge>
								</Row>
							</Stack>
						</Row> */}

						{/* {module.moduleChunks.map((chunk) => (
							<Card key={chunk.id} padding={1} gap={0.5}>
								<Text weight={500} size="xs" color="muted">
									Page {chunk.pageNumber}
								</Text>
								<Text whiteSpace="pre-wrap" size="sm">
									{chunk.content}
								</Text>
							</Card>
						))} */}
					</Card>
				))}
			</Section.Container>
		</Section>
	);
}

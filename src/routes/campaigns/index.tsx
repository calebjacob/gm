import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { BookOpenTextIcon, PlusIcon } from "lucide-react";
import { useEffect } from "react";
import { LinkButton } from "@/components/lib/Button";
import { Card } from "@/components/lib/Card";
import { Icon } from "@/components/lib/Icon";
import { Row } from "@/components/lib/Row";
import { Section } from "@/components/lib/Section";
import { Stack } from "@/components/lib/Stack";
import { Text } from "@/components/lib/Text";
import { ThumbnailImage } from "@/components/lib/ThumbnailImage";
import type { CampaignSchema } from "@/schemas/campaign";
import { getCurrentUserId } from "@/server/auth";
import { db } from "@/server/db";
import { fullPathToUploadedFile } from "@/utils/files";
import { toRouteTitle } from "@/utils/route-title";

const getCampaignsServer = createServerFn({
	method: "GET",
}).handler(async () => {
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

	// TODO: Map this properly since there are multiple modules per campaign
	console.log(campaignsQuery.rows);

	return { campaigns: [] as CampaignSchema[] };
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
	const data = Route.useLoaderData();
	const router = useRouter();

	useEffect(() => {
		if (data.campaigns.length === 0) {
			router.navigate({ to: "/campaigns/new" });
		}
	}, [data.campaigns, router]);

	return (
		<Section>
			<Section.Container>
				<Stack gap={0.5}>
					<Row align="baseline" gap={1}>
						<Icon color="muted" size={1.5}>
							<BookOpenTextIcon />
						</Icon>

						<Text tag="h1" size="xl" family="gothic" color="muted" weight={300}>
							Campaigns
						</Text>

						<LinkButton to="/campaigns/new" style={{ marginLeft: "auto" }}>
							<PlusIcon size={16} /> New Campaign
						</LinkButton>
					</Row>

					<Text size="lg">
						Continue an existing campaign or start a new adventure.
					</Text>
				</Stack>

				{data.campaigns.map((campaign) => (
					<Card key={campaign.id} padding={1} gap={1}>
						<Row align="center" gap={1}>
							<ThumbnailImage
								src={
									campaign.coverImagePath
										? fullPathToUploadedFile(campaign.coverImagePath)
										: null
								}
								alt={campaign.name}
								placeholder={<BookOpenTextIcon size={16} />}
								aspectRatio="3 / 4"
								size={4}
							/>

							<Stack gap={0.5}>
								<Text tag="h3" size="xl" family="gothic">
									{campaign.name}
								</Text>

								<Text size="sm" color="muted">
									{campaign.description}
								</Text>
							</Stack>
						</Row>
					</Card>
				))}
			</Section.Container>
		</Section>
	);
}

import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Section } from "@/components/lib/Section";
import { Text } from "@/components/lib/Text";
import { QueryTest } from "@/components/QueryTest";
import { campaignSchema } from "@/schemas/campaign";
import { getCurrentUserId } from "@/server/auth";
import { getDb } from "@/server/db";

export const Route = createFileRoute("/campaigns/$id")({
	component: RouteComponent,
	loader: ({ params }) => getCampaignServer({ data: params }),
});

const getCampaignServer = createServerFn({
	method: "GET",
})
	.inputValidator(
		z.object({
			id: z.string(),
		}),
	)
	.handler(async ({ data }) => {
		const db = getDb();

		const campaignQuery = await db.execute({
			sql: "SELECT * FROM campaigns WHERE id = $id AND userId = $userId",
			args: { id: data.id, userId: getCurrentUserId() },
		});

		const campaign = campaignSchema.parse(campaignQuery.rows[0]);

		return { campaign };
	});

function RouteComponent() {
	const data = Route.useLoaderData();
	const params = Route.useParams();

	return (
		<Section>
			<Section.Container>
				<Text tag="h1" size="xl" family="gothic" color="muted" weight={300}>
					{data.campaign.name}
				</Text>

				<QueryTest campaignId={params.id} />
			</Section.Container>
		</Section>
	);
}

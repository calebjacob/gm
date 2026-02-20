import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow } from "date-fns";
import {
	ArrowRightIcon,
	EllipsisIcon,
	NotebookTextIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { GeminiTest } from "@/components/GeminiTest";
import { Badge } from "@/components/lib/Badge";
import { Button } from "@/components/lib/Button";
import { Card } from "@/components/lib/Card";
import { Icon } from "@/components/lib/Icon";
import { Menu } from "@/components/lib/Menu";
import { Row } from "@/components/lib/Row";
import { Section } from "@/components/lib/Section";
import { Stack } from "@/components/lib/Stack";
import { StepNumber } from "@/components/lib/StepNumber";
import { Text } from "@/components/lib/Text";
import { DEFAULT_TOAST_OPTIONS, toastQueue } from "@/components/lib/Toast";
import { ModuleSelector } from "@/components/ModuleSelector";
import { type CampaignSchema, campaignSchema } from "@/schemas/campaign";
import { characterSchema } from "@/schemas/character";
import {
	campaignsModulesSchema,
	type ModuleSchema,
	moduleSchema,
} from "@/schemas/module";
import { rulesetDetails } from "@/schemas/ruleset";
import { getCurrentUserId } from "@/server/auth";
import { db } from "@/server/db";
import { handleClientError } from "@/utils/errors";
import { toRouteTitle } from "@/utils/route-title";

const updateCampaignServer = createServerFn({
	method: "POST",
})
	.inputValidator(
		z.object({
			campaignId: z.string(),
			moduleIds: z.array(z.string()).optional(),
		}),
	)
	.handler(async ({ data }) => {
		try {
			if (data.moduleIds) {
				await db.execute({
					sql: `
						DELETE FROM "campaignsModules" WHERE "campaignId" = $campaignId
					`,
					args: {
						campaignId: data.campaignId,
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
							campaignId: data.campaignId,
							moduleId,
						},
					});
				}
			}

			return {};
		} catch (error) {
			console.error(error);
			throw new Error("Failed to update campaign");
		}
	});

const getResourcesServer = createServerFn({
	method: "GET",
}).handler(async () => {
	try {
		const draftCampaignQuery = await db.execute({
			sql: `
			SELECT * FROM "campaigns" WHERE "userId" = $userId AND "status" = 'draft'
		`,
			args: {
				userId: getCurrentUserId(),
			},
		});

		let campaign =
			draftCampaignQuery.rows.length > 0
				? campaignSchema.parse(draftCampaignQuery.rows[0])
				: null;

		if (!campaign) {
			const newCampaign: CampaignSchema = {
				id: crypto.randomUUID(),
				userId: getCurrentUserId(),
				ruleset: "dnd-5e",
				status: "draft",
				name: "Untitled",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			await db.execute({
				sql: `
				INSERT INTO "campaigns" ("id", "userId", "status", "name", "ruleset", "description", "coverImagePath", "createdAt", "updatedAt")
				VALUES ($id, $userId, $status, $name, $ruleset, $description, $coverImagePath, $createdAt, $updatedAt)
			`,
				args: {
					...newCampaign,
					description: newCampaign.description || null,
					coverImagePath: newCampaign.coverImagePath || null,
					createdAt: newCampaign.createdAt.toISOString(),
					updatedAt: newCampaign.updatedAt.toISOString(),
				},
			});

			campaign = newCampaign;
		}

		const charactersQuery = await db.execute({
			sql: `
			SELECT * FROM "characters" WHERE "campaignId" = $campaignId
		`,
			args: {
				campaignId: campaign.id,
			},
		});

		const characters = characterSchema.array().parse(charactersQuery.rows);

		const campaignsModulesQuery = await db.execute({
			sql: `
			SELECT * FROM "campaignsModules" WHERE "campaignId" = $campaignId
		`,
			args: {
				campaignId: campaign.id,
			},
		});

		const campaignsModules = campaignsModulesSchema
			.array()
			.parse(campaignsModulesQuery.rows);

		const selectedModuleIds = campaignsModules.map(
			(campaignsModule) => campaignsModule.moduleId,
		);

		const modulesQuery = await db.execute({
			sql: `
				SELECT
					id,
					"userId",
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

		return { campaign, characters, modules, selectedModuleIds };
	} catch (error) {
		console.error(error);
		throw new Error("Failed to create campaign draft");
	}
});

const removeCampaignServer = createServerFn({
	method: "POST",
})
	.inputValidator(
		z.object({
			campaignId: z.string(),
		}),
	)
	.handler(async ({ data }) => {
		try {
			await db.execute({
				sql: `
					DELETE FROM "campaigns" WHERE "id" = $campaignId AND "userId" = $userId
				`,
				args: {
					campaignId: data.campaignId,
					userId: getCurrentUserId(),
				},
			});

			return { success: true };
		} catch (error) {
			console.error(error);
			throw new Error("Failed to remove draft campaign");
		}
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
	const updateCampaignClient = useServerFn(updateCampaignServer);
	const removeCampaignClient = useServerFn(removeCampaignServer);
	const [moduleIds, setModuleIds] = useState<string[]>([]);

	const stepOneCompleted = data.selectedModuleIds.length > 0;
	const stepTwoCompleted = data.characters.length > 0;

	const removeCampaign = async () => {
		try {
			await removeCampaignClient({ data: { campaignId: data.campaign.id } });
			await router.invalidate();
		} catch (error) {
			handleClientError(error);
		}
	};

	const selectModules = async (modules: ModuleSchema[]) => {
		try {
			const moduleIds = modules.map((module) => module.id);
			setModuleIds(moduleIds);
			await updateCampaignClient({
				data: { campaignId: data.campaign.id, moduleIds },
			});
			await router.invalidate();
		} catch (error) {
			handleClientError(error);
		}
	};

	const startCampaign = async () => {};

	return (
		<Section>
			<GeminiTest />

			<Section.Container gap={3}>
				<Stack gap={0.5}>
					<Text tag="h1" size="xl" family="gothic" color="muted" weight={300}>
						Start a new campaign
					</Text>

					<Row align="center" justify="space-between" gap={1}>
						<Row align="center" gap={0.5}>
							<Badge>
								<Icon size={0.6}>
									<NotebookTextIcon />
								</Icon>
								<Text weight={500}>
									{rulesetDetails[data.campaign.ruleset].name}
								</Text>
							</Badge>
						</Row>

						<Row align="center" gap={0.5}>
							<Text size="xs" color="muted">
								Draft saved{" "}
								{formatDistanceToNow(data.campaign.updatedAt, {
									addSuffix: true,
								})}
							</Text>

							<Menu>
								<Button
									icon
									color="muted"
									size="sm"
									onClick={() => {
										router.navigate({ to: "/campaigns/new" });
									}}
								>
									<EllipsisIcon />
								</Button>

								<Menu.Dropdown>
									<Menu.Section>
										<Menu.Item onClick={removeCampaign}>
											<Icon color="error" size={1}>
												<Trash2Icon />
											</Icon>
											Discard Draft
										</Menu.Item>
									</Menu.Section>
								</Menu.Dropdown>
							</Menu>
						</Row>
					</Row>
				</Stack>

				<Stack gap={1}>
					<Row align="center" gap={0.5}>
						<StepNumber number={1} completed={stepOneCompleted} />
						<Text size="lg">Shape your world</Text>
					</Row>

					<Text color="muted">
						Upload any number of content modules compatible with{" "}
						<Text weight={500} tag="span" color="standard">
							{rulesetDetails[data.campaign.ruleset].name}
						</Text>{" "}
						to define the setting of your campaign. This will determine the
						stories, characters, and locations of your campaign.
					</Text>

					{/* TODO */}
					<ModuleSelector
						selectedModuleIds={moduleIds}
						onSelectModules={selectModules}
					/>
				</Stack>

				<Stack gap={1}>
					<Row align="center" gap={0.5}>
						<StepNumber number={2} completed={stepTwoCompleted} />
						<Text size="lg">Create your characters</Text>
					</Row>

					<Text color="muted">
						Will you adventure alone or be accompanied by companions?
					</Text>

					<Button>
						<PlusIcon size={16} />
						Add Character
					</Button>
				</Stack>

				<Stack gap={2}>
					<Row align="center" gap={0.5}>
						<StepNumber number={3} completed={false} />
						<Text size="lg">Your adventure begins</Text>
					</Row>

					<Card>
						<Text family="serif" size="lg">
							A preview of where the campaign will start. It will be the exact
							content that is used to start the campaign conversation. This may
							be a few paragraphs of text or a map. It will be generated based
							on the rules and content uploaded in step 1. It gives the user a
							chance to review and shuffle the starting location.
						</Text>
					</Card>

					<Button color="success" size="lg" onClick={startCampaign}>
						Start Campaign
						<ArrowRightIcon size={20} />
					</Button>
				</Stack>
			</Section.Container>
		</Section>
	);
}

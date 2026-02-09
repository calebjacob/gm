import { createRouter } from "@tanstack/react-router";
import { Section } from "./components/lib/Section";
import { Stack } from "./components/lib/Stack";
import { Text } from "./components/lib/Text";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
	const router = createRouter({
		routeTree,
		context: {},

		scrollRestoration: true,
		defaultPreloadStaleTime: 0,

		defaultNotFoundComponent: () => {
			return (
				<Section height="min-viewport">
					<Stack align="center" justify="center" margin="auto">
						<Text tag="h1" size="xl" family="gothic" color="muted" weight={300}>
							404
						</Text>
						<Text>
							You have turned to a blank page, Traveler.{" "}
							<Text.Link to="/">Go home?</Text.Link>
						</Text>
					</Stack>
				</Section>
			);
		},
	});

	return router;
};

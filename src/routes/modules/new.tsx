import { createFileRoute } from "@tanstack/react-router";
import { toRouteTitle } from "@/utils/route-title";

export const Route = createFileRoute("/modules/new")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{
				title: toRouteTitle("New Module"),
			},
		],
	}),
});

function RouteComponent() {
	return <div>Hello "/modules/new"!</div>;
}

import { createFileRoute } from "@tanstack/react-router";
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
	return <div>Hello "/modules"!</div>;
}

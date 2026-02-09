import { createFileRoute } from "@tanstack/react-router";
import { toRouteTitle } from "@/utils/route-title";
import styles from "./index.module.css";

export const Route = createFileRoute("/")({
	component: App,
	head: () => ({
		meta: [
			{
				title: toRouteTitle("Home"),
			},
		],
	}),
});

function App() {
	return (
		<div className={styles.page}>
			<h1>Hello World</h1>
		</div>
	);
}

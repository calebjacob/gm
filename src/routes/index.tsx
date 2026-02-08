import { createFileRoute } from "@tanstack/react-router";

import styles from "./index.module.css";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<div className={styles.page}>
			<h1>Hello World</h1>
		</div>
	);
}

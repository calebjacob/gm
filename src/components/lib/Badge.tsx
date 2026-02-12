import styles from "./Badge.module.css";

export function Badge({
	children,
	uppercase,
}: {
	children: React.ReactNode;
	uppercase?: boolean;
}) {
	return (
		<div className={styles.badge} data-uppercase={uppercase}>
			{children}
		</div>
	);
}

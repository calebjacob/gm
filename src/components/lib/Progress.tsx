import styles from "./Progress.module.css";

export function Progress({
	value,
	total = 1,
}: {
	value: number | undefined;
	total?: number;
}) {
	const progress =
		typeof value === "number" && typeof total === "number" && total > 0
			? value / total
			: 0;

	return (
		<div className={styles.progress} data-working={progress <= 1}>
			<div className={styles.flicker} />
			<div className={styles.fill} style={{ width: `${progress * 100}%` }} />
		</div>
	);
}

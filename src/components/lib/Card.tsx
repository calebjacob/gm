import styles from "./Card.module.css";

export function Card({
	children,
	padding = 2,
	gap = 1,
}: {
	children: React.ReactNode;
	gap?: number;
	padding?: number;
}) {
	return (
		<div
			className={styles.card}
			style={{
				padding: padding ? `${padding}rem` : undefined,
				gap: gap ? `${gap}rem` : undefined,
			}}
		>
			{children}
		</div>
	);
}

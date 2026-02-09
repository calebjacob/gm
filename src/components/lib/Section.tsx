import styles from "./Section.module.css";

export function Section({
	children,
	height,
	padding,
	gap,
}: {
	children: React.ReactNode;
	height?: "min-viewport";
	padding?: number;
	gap?: number;
}) {
	return (
		<div
			className={styles.section}
			data-height={height}
			style={{
				padding: padding ? `${padding}rem` : undefined,
				gap: gap ? `${gap}rem` : undefined,
			}}
		>
			{children}
		</div>
	);
}

Section.Container = Container;

function Container({
	children,
	gap,
}: {
	children: React.ReactNode;
	gap?: number;
}) {
	return (
		<div
			className={styles.container}
			style={{ gap: gap ? `${gap}rem` : undefined }}
		>
			{children}
		</div>
	);
}

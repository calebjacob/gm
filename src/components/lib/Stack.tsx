import type { CSSProperties } from "react";
import styles from "./Stack.module.css";

interface StackProps {
	children: React.ReactNode;
	align?: CSSProperties["alignItems"];
	justify?: CSSProperties["justifyContent"];
	margin?: CSSProperties["margin"];
	gap?: number;
}

export function Stack({
	children,
	align,
	justify,
	margin,
	gap = 1,
}: StackProps) {
	return (
		<div
			className={styles.stack}
			style={{
				gap: `${gap}rem`,
				alignItems: align,
				justifyContent: justify,
				margin,
			}}
		>
			{children}
		</div>
	);
}

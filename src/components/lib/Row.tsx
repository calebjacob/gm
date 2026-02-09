import type { CSSProperties } from "react";
import styles from "./Row.module.css";

interface RowProps {
	children: React.ReactNode;
	align?: CSSProperties["alignItems"];
	justify?: CSSProperties["justifyContent"];
	gap?: number;
	wrap?: boolean;
}

export function Row({
	children,
	align,
	justify,
	gap = 1,
	wrap = false,
}: RowProps) {
	return (
		<div
			className={styles.row}
			style={{
				gap: `${gap}rem`,
				alignItems: align,
				justifyContent: justify,
				flexWrap: wrap ? "wrap" : "nowrap",
			}}
		>
			{children}
		</div>
	);
}

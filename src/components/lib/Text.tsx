import {
	Link as RouterLink,
	type LinkProps as RouterLinkProps,
} from "@tanstack/react-router";
import type { CSSProperties } from "react";
import styles from "./Text.module.css";

interface TextProps {
	children: React.ReactNode;
	size?: "xs" | "sm" | "md" | "lg" | "xl";
	tag?: "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span";
	family?: "gothic" | "sans";
	weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
	style?: "normal" | "italic";
	color?: "current" | "standard" | "muted" | "success" | "error" | "warning";
	className?: string;
	whiteSpace?: CSSProperties["whiteSpace"];
	lineClamp?: number;
}

export function Text({
	children,
	size,
	tag = "p",
	family,
	weight,
	style,
	color,
	whiteSpace,
	lineClamp,
	...props
}: TextProps) {
	const Tag = tag;

	return (
		<Tag
			className={styles.text}
			data-size={size}
			data-family={family}
			data-color={color}
			data-line-clamp={lineClamp ? true : undefined}
			style={{
				fontWeight: weight,
				fontStyle: style,
				whiteSpace,
				WebkitLineClamp: lineClamp,
			}}
			{...props}
		>
			{children}
		</Tag>
	);
}

Text.Link = Link;

function Link({
	color = "action",
	...props
}: RouterLinkProps & {
	color?:
		| "current"
		| "action"
		| "standard"
		| "muted"
		| "success"
		| "error"
		| "warning";
}) {
	return <RouterLink className={styles.link} data-color={color} {...props} />;
}

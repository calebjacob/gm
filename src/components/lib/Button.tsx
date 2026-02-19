import { Link, type LinkProps } from "@tanstack/react-router";
import styles from "./Button.module.css";

type BaseButtonProps = {
	children: React.ReactNode;
	size?: "sm" | "md" | "lg";
	className?: string;
	style?: React.CSSProperties;
	color?: "action" | "success" | "error" | "muted";
	icon?: boolean;
};

export function Button({
	children,
	size = "md",
	type = "button",
	color,
	icon,
	...props
}: BaseButtonProps &
	Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">) {
	return (
		<button
			className={styles.button}
			data-size={size}
			data-color={color}
			data-icon={icon}
			type={type}
			{...props}
		>
			<span className={styles.label}>{children}</span>
		</button>
	);
}

export function LinkButton({
	children,
	size = "md",
	icon,
	color,
	...props
}: BaseButtonProps & Omit<LinkProps, "color">) {
	return (
		<Link
			className={styles.button}
			data-size={size}
			data-color={color}
			data-icon={icon}
			{...props}
		>
			<span className={styles.label}>{children}</span>
		</Link>
	);
}

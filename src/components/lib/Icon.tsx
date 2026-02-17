import styles from "./Icon.module.css";

interface IconProps {
	children: React.ReactNode;
	size?: number;
	color?:
		| "current"
		| "standard"
		| "muted"
		| "success"
		| "error"
		| "warning"
		| "action";
}

export function Icon({ children, size = 1, color = "standard" }: IconProps) {
	return (
		<div
			className={styles.icon}
			data-color={color}
			style={{ width: `${size}rem`, height: `${size}rem` }}
		>
			{children}
		</div>
	);
}

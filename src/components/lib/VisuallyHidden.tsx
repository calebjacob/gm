import styles from "./VisuallyHidden.module.css";

export function VisuallyHidden({ children }: { children: React.ReactNode }) {
	return <span className={styles.hidden}>{children}</span>;
}

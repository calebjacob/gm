import styles from "./Badge.module.css";

export function Badge({ children }: { children: React.ReactNode }) {
	return <div className={styles.badge}>{children}</div>;
}

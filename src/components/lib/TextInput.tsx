import { Text } from "./Text";
import styles from "./TextInput.module.css";

export function TextInput({
	label,
	error,
	...props
}: {
	label: string;
	value: string | undefined | null;
	error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
	return (
		<label className={styles.wrapper} aria-invalid={error ? true : undefined}>
			<span className={styles.label}>{label}</span>
			<input className={styles.input} id={label} {...props} />
			{error && (
				<Text size="xs" color="error" tag="span">
					{error}
				</Text>
			)}
		</label>
	);
}

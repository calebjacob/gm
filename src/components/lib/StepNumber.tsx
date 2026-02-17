import { CheckIcon } from "lucide-react";
import styles from "./StepNumber.module.css";

export function StepNumber({
	number,
	completed,
}: {
	number: number;
	completed: boolean;
}) {
	return (
		<span
			className={styles.stepNumber}
			data-completed={completed}
			role="presentation"
			aria-label={`Step ${number}`}
		>
			{completed ? <CheckIcon size={12} /> : number}
		</span>
	);
}

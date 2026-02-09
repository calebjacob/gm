import {
	AlertCircleIcon,
	AlertTriangleIcon,
	CheckIcon,
	InfoIcon,
	XIcon,
} from "lucide-react";
import {
	Button as AriaButton,
	Text as AriaText,
	UNSTABLE_Toast as AriaToast,
	UNSTABLE_ToastContent as AriaToastContent,
	type ToastOptions as AriaToastOptions,
	UNSTABLE_ToastQueue as AriaToastQueue,
	UNSTABLE_ToastRegion as AriaToastRegion,
} from "react-aria-components";
import { flushSync } from "react-dom";
import { Icon } from "./Icon";
import { Stack } from "./Stack";
import { Text } from "./Text";
import styles from "./Toast.module.css";

export const toastQueue = new AriaToastQueue<{
	type?: "success" | "error" | "info" | "warning";
	title: string;
	description?: string;
}>({
	wrapUpdate(fn) {
		if ("startViewTransition" in document) {
			document.startViewTransition(() => {
				flushSync(fn);
			});
		} else {
			fn();
		}
	},
	maxVisibleToasts: 3,
});

export const DEFAULT_TOAST_OPTIONS: AriaToastOptions = {
	timeout: 6000,
};

export function ToastRegion() {
	return (
		<AriaToastRegion queue={toastQueue} className={styles.toastRegion}>
			{({ toast }) => (
				<AriaToast
					toast={toast}
					style={{ viewTransitionName: toast.key }}
					className={styles.toast}
				>
					<AriaToastContent className={styles.content}>
						<div className={styles.icon}>
							{toast.content.type === "success" && (
								<Icon color="success">
									<CheckIcon />
								</Icon>
							)}

							{toast.content.type === "error" && (
								<Icon color="error">
									<AlertCircleIcon />
								</Icon>
							)}

							{toast.content.type === "warning" && (
								<Icon color="warning">
									<AlertTriangleIcon />
								</Icon>
							)}

							{toast.content.type === "info" && (
								<Icon color="standard">
									<InfoIcon />
								</Icon>
							)}
						</div>

						<Stack gap={0.5}>
							<AriaText slot="title">
								<Text tag="span" size="sm" weight={600} color="standard">
									{toast.content.title}
								</Text>
							</AriaText>

							{toast.content.description && (
								<AriaText slot="description">
									<Text tag="span" size="sm" color="standard">
										{toast.content.description}
									</Text>
								</AriaText>
							)}
						</Stack>
					</AriaToastContent>

					<AriaButton
						slot="close"
						aria-label="Close"
						className={styles.closeButton}
					>
						<XIcon size={16} />
					</AriaButton>
				</AriaToast>
			)}
		</AriaToastRegion>
	);
}

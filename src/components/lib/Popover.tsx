import clsx from "clsx";
import {
	OverlayArrow as AriaOverlayArrow,
	Popover as AriaPopover,
	type PopoverProps as AriaPopoverProps,
} from "react-aria-components";

import styles from "./Popover.module.css";

export interface PopoverProps extends Omit<AriaPopoverProps, "children"> {
	children: React.ReactNode;
	hideArrow?: boolean;
}

export function Popover({ children, hideArrow, ...props }: PopoverProps) {
	return (
		<AriaPopover {...props} className={clsx(styles.popover, props.className)}>
			{() => (
				<>
					{!hideArrow && (
						<AriaOverlayArrow className={styles.arrow}>
							<svg
								width={12}
								height={12}
								viewBox="0 0 12 12"
								aria-hidden="true"
							>
								<path d="M0 0 L6 6 L12 0" />
							</svg>
						</AriaOverlayArrow>
					)}
					<div className={styles.content}>{children}</div>
				</>
			)}
		</AriaPopover>
	);
}

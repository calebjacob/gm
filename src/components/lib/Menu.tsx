import clsx from "clsx";
import {
	CheckCircle2Icon,
	CheckSquare2Icon,
	ChevronRightIcon,
	CircleIcon,
	SquareIcon,
} from "lucide-react";
import React, { type DOMAttributes } from "react";
import {
	Menu as AriaMenu,
	MenuItem as AriaMenuItem,
	MenuSection as AriaMenuSection,
	MenuTrigger as AriaMenuTrigger,
	SubmenuTrigger as AriaSubmenuTrigger,
	Header,
	type MenuItemProps,
	type MenuProps,
	type MenuSectionProps,
	type MenuTriggerProps,
	Pressable,
	type SubmenuTriggerProps,
} from "react-aria-components";
import styles from "./Menu.module.css";
import { Popover } from "./Popover";

export function Menu(props: MenuTriggerProps) {
	const [trigger, menu] = React.Children.toArray(props.children) as [
		React.ReactElement<DOMAttributes<HTMLButtonElement>, string>,
		React.ReactElement,
	];
	return (
		<AriaMenuTrigger {...props}>
			<Pressable>{trigger}</Pressable>
			<Popover offset={0}>{menu}</Popover>
		</AriaMenuTrigger>
	);
}

Menu.Dropdown = Dropdown;
Menu.Item = Item;
Menu.Section = Section;
Menu.SectionHeader = SectionHeader;
Menu.SubmenuTrigger = SubmenuTrigger;

function Dropdown<T extends object>(props: MenuProps<T>) {
	return (
		<AriaMenu {...props} className={clsx(styles.menu, props.className)}>
			{props.children}
		</AriaMenu>
	);
}

function Item(
	props: Omit<MenuItemProps, "children"> & { children?: React.ReactNode },
) {
	const textValue =
		props.textValue ||
		(typeof props.children === "string" ? props.children : undefined);
	return (
		<AriaMenuItem
			{...props}
			textValue={textValue}
			className={clsx(styles.menuItem, props.className)}
		>
			{({ hasSubmenu, isSelected, selectionMode }) => (
				<>
					{selectionMode === "multiple" &&
						(isSelected ? (
							<CheckSquare2Icon className={styles.menuSelectIcon} />
						) : (
							<SquareIcon className={styles.menuSelectIcon} />
						))}

					{selectionMode === "single" &&
						(isSelected ? (
							<CheckCircle2Icon className={styles.menuSelectIcon} />
						) : (
							<CircleIcon className={styles.menuSelectIcon} />
						))}

					{props.children}

					{hasSubmenu && (
						<ChevronRightIcon className={styles.submenuChevronIcon} />
					)}
				</>
			)}
		</AriaMenuItem>
	);
}

function Section<T extends object>(props: MenuSectionProps<T>) {
	return (
		<AriaMenuSection
			{...props}
			className={clsx(styles.menuSection, props.className)}
		/>
	);
}

function SectionHeader() {
	return <Header className={styles.menuSectionHeader} />;
}

function SubmenuTrigger(props: SubmenuTriggerProps) {
	const [trigger, menu] = React.Children.toArray(props.children) as [
		React.ReactElement,
		React.ReactElement,
	];

	return (
		<AriaSubmenuTrigger {...props}>
			{trigger}
			<Popover hideArrow offset={-2} crossOffset={-4}>
				{menu}
			</Popover>
		</AriaSubmenuTrigger>
	);
}

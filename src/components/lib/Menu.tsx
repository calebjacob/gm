import { Link, type LinkComponentProps } from "@tanstack/react-router";
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
	Header as AriaHeader,
	Menu as AriaMenu,
	MenuItem as AriaMenuItem,
	type MenuItemProps as AriaMenuItemProps,
	type MenuProps as AriaMenuProps,
	MenuSection as AriaMenuSection,
	type MenuSectionProps as AriaMenuSectionProps,
	MenuTrigger as AriaMenuTrigger,
	type MenuTriggerProps as AriaMenuTriggerProps,
	Pressable as AriaPressable,
	SubmenuTrigger as AriaSubmenuTrigger,
	type SubmenuTriggerProps as AriaSubmenuTriggerProps,
} from "react-aria-components";
import styles from "./Menu.module.css";
import { Popover } from "./Popover";

export function Menu(props: AriaMenuTriggerProps) {
	const [trigger, menu] = React.Children.toArray(props.children) as [
		React.ReactElement<DOMAttributes<HTMLButtonElement>, string>,
		React.ReactElement,
	];
	return (
		<AriaMenuTrigger {...props}>
			<AriaPressable>{trigger}</AriaPressable>
			<Popover offset={0}>{menu}</Popover>
		</AriaMenuTrigger>
	);
}

Menu.Dropdown = Dropdown;
Menu.Item = Item;
Menu.Section = Section;
Menu.SectionHeader = SectionHeader;
Menu.SubmenuTrigger = SubmenuTrigger;

function Dropdown<T extends object>(props: AriaMenuProps<T>) {
	return (
		<AriaMenu {...props} className={clsx(styles.menu, props.className)}>
			{props.children}
		</AriaMenu>
	);
}

function Item(
	props: Omit<AriaMenuItemProps, "children" | "href" | "hrefLang"> & {
		children?: React.ReactNode;
		link?: LinkComponentProps;
	},
) {
	const textValue =
		props.textValue ||
		(typeof props.children === "string" ? props.children : undefined);

	return (
		<AriaMenuItem
			{...props}
			textValue={textValue}
			href={props.link?.to}
			className={clsx(styles.menuItem, props.className)}
			render={(domProps) =>
				"href" in domProps && domProps.href ? (
					<Link to={props.link?.to} {...domProps} />
				) : (
					// @ts-expect-error
					<div {...domProps} />
				)
			}
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

function Section<T extends object>(props: AriaMenuSectionProps<T>) {
	return (
		<AriaMenuSection
			{...props}
			className={clsx(styles.menuSection, props.className)}
		/>
	);
}

function SectionHeader() {
	return <AriaHeader className={styles.menuSectionHeader} />;
}

function SubmenuTrigger(props: AriaSubmenuTriggerProps) {
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

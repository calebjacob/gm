import { Link } from "@tanstack/react-router";
import {
	BookOpenTextIcon,
	ChevronDownIcon,
	MapIcon,
	MenuIcon,
	PencilRulerIcon,
	SquareLibraryIcon,
	UserCircleIcon,
} from "lucide-react";
import styles from "./Header.module.css";
import { Menu } from "./lib/Menu";

export default function Header() {
	return (
		<header className={styles.header}>
			<Link to="/" className={styles.logo}>
				G.M.
			</Link>

			<Menu>
				<button type="button" className={styles.button} aria-label="Main Menu">
					<MenuIcon className={styles.buttonIcon} />
				</button>

				<Menu.Dropdown>
					<Menu.Section>
						<Menu.Item onAction={() => alert("open")}>
							<PencilRulerIcon />
							Rulesets
						</Menu.Item>

						<Menu.Item onAction={() => alert("open")}>
							<MapIcon />
							Worlds
						</Menu.Item>

						<Menu.Item onAction={() => alert("open")}>
							<BookOpenTextIcon />
							Campaigns
						</Menu.Item>
					</Menu.Section>
				</Menu.Dropdown>
			</Menu>

			<button type="button" className={styles.button}>
				<span className={styles.buttonSection}>
					<span className={styles.buttonText}>
						The Curse of the Black Pearl
					</span>
				</span>
				<ChevronDownIcon className={styles.dropdownIcon} />
			</button>

			<div className={styles.right}>
				<button
					type="button"
					className={styles.button}
					aria-label="User Settings"
				>
					<UserCircleIcon className={styles.buttonIcon} />
				</button>
			</div>
		</header>
	);
}

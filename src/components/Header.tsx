import { Link } from "@tanstack/react-router";
import {
	BookOpenTextIcon,
	ChevronDownIcon,
	MenuIcon,
	PencilRulerIcon,
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
						<Menu.Item link={{ to: "/modules" }}>
							<PencilRulerIcon />
							Modules
						</Menu.Item>

						<Menu.Item link={{ to: "/campaigns" }}>
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
		</header>
	);
}

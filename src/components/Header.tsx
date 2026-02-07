import { Link } from '@tanstack/react-router'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Home,
  Menu,
  Network,
  SquareFunction,
  StickyNote,
  X,
} from 'lucide-react'

import styles from './Header.module.css'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [groupedExpanded, setGroupedExpanded] = useState<
    Record<string, boolean>
  >({})

  return (
    <>
      <header className={styles.header}>
        <button
          onClick={() => setIsOpen(true)}
          className={styles.menuButton}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <h1 className={styles.title}>
          <Link to="/">
            <img
              src="/tanstack-word-logo-white.svg"
              alt="TanStack Logo"
              className={styles.logo}
            />
          </Link>
        </h1>
      </header>

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : styles.sidebarClosed}`}
      >
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className={styles.closeButton}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className={styles.nav}>
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className={styles.navLink}
            activeProps={{ className: styles.navLinkActive }}
          >
            <Home size={20} />
            <span className={styles.navLabel}>Home</span>
          </Link>

          <Link
            to="/demo/start/server-funcs"
            onClick={() => setIsOpen(false)}
            className={styles.navLink}
            activeProps={{ className: styles.navLinkActive }}
          >
            <SquareFunction size={20} />
            <span className={styles.navLabel}>Start - Server Functions</span>
          </Link>

          <Link
            to="/demo/start/api-request"
            onClick={() => setIsOpen(false)}
            className={styles.navLink}
            activeProps={{ className: styles.navLinkActive }}
          >
            <Network size={20} />
            <span className={styles.navLabel}>Start - API Request</span>
          </Link>

          <div className={styles.ssrRow}>
            <Link
              to="/demo/start/ssr"
              onClick={() => setIsOpen(false)}
              className={styles.navLinkFlex1}
              activeProps={{ className: styles.navLinkFlex1Active }}
            >
              <StickyNote size={20} />
              <span className={styles.navLabel}>Start - SSR Demos</span>
            </Link>
            <button
              className={styles.expandButton}
              onClick={() =>
                setGroupedExpanded((prev) => ({
                  ...prev,
                  StartSSRDemo: !prev.StartSSRDemo,
                }))
              }
            >
              {groupedExpanded.StartSSRDemo ? (
                <ChevronDown size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </button>
          </div>
          {groupedExpanded.StartSSRDemo && (
            <div className={styles.subnav}>
              <Link
                to="/demo/start/ssr/spa-mode"
                onClick={() => setIsOpen(false)}
                className={styles.navLink}
                activeProps={{ className: styles.navLinkActive }}
              >
                <StickyNote size={20} />
                <span className={styles.navLabel}>SPA Mode</span>
              </Link>

              <Link
                to="/demo/start/ssr/full-ssr"
                onClick={() => setIsOpen(false)}
                className={styles.navLink}
                activeProps={{ className: styles.navLinkActive }}
              >
                <StickyNote size={20} />
                <span className={styles.navLabel}>Full SSR</span>
              </Link>

              <Link
                to="/demo/start/ssr/data-only"
                onClick={() => setIsOpen(false)}
                className={styles.navLink}
                activeProps={{ className: styles.navLinkActive }}
              >
                <StickyNote size={20} />
                <span className={styles.navLabel}>Data Only</span>
              </Link>
            </div>
          )}
        </nav>
      </aside>
    </>
  )
}

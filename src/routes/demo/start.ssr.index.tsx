import { createFileRoute, Link } from '@tanstack/react-router'

import styles from './demo.module.css'

export const Route = createFileRoute('/demo/start/ssr/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div
      className={styles.page}
      style={{
        backgroundImage:
          'radial-gradient(50% 50% at 20% 60%, #1a1a1a 0%, #0a0a0a 50%, #000000 100%)',
      }}
    >
      <div className={styles.card}>
        <h1 className={`${styles.titleCenter} ${styles.titleGradient}`}>
          SSR Demos
        </h1>
        <div className={styles.links}>
          <Link to="/demo/start/ssr/spa-mode" className={styles.linkPink}>
            SPA Mode
          </Link>
          <Link to="/demo/start/ssr/full-ssr" className={styles.linkPurple}>
            Full SSR
          </Link>
          <Link to="/demo/start/ssr/data-only" className={styles.linkGreen}>
            Data Only
          </Link>
        </div>
      </div>
    </div>
  )
}

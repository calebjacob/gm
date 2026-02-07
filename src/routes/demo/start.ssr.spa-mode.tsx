import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getPunkSongs } from '@/data/demo.punk-songs'

import styles from './demo.module.css'

export const Route = createFileRoute('/demo/start/ssr/spa-mode')({
  ssr: false,
  component: RouteComponent,
})

function RouteComponent() {
  const [punkSongs, setPunkSongs] = useState<
    Awaited<ReturnType<typeof getPunkSongs>>
  >([])

  useEffect(() => {
    getPunkSongs().then(setPunkSongs)
  }, [])

  return (
    <div
      className={styles.page}
      style={{
        backgroundImage:
          'radial-gradient(50% 50% at 20% 60%, #1a1a1a 0%, #0a0a0a 50%, #000000 100%)',
      }}
    >
      <div className={styles.card}>
        <h1 className={`${styles.title} ${styles.titleGreen}`}>
          SPA Mode - Punk Songs
        </h1>
        <ul className={`${styles.list} ${styles.listSpaced}`}>
          {punkSongs.map((song) => (
            <li key={song.id} className={styles.listItem}>
              <span className={styles.itemName}>{song.name}</span>
              <span className={styles.itemMeta}> - {song.artist}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

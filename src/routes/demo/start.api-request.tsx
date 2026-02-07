import { useEffect, useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import styles from './demo.module.css'

function getNames() {
  return fetch('/demo/api/names').then((res) => res.json() as Promise<string[]>)
}

export const Route = createFileRoute('/demo/start/api-request')({
  component: Home,
})

function Home() {
  const [names, setNames] = useState<Array<string>>([])

  useEffect(() => {
    getNames().then(setNames)
  }, [])

  return (
    <div
      className={styles.page}
      style={{
        backgroundColor: '#000',
        backgroundImage:
          'radial-gradient(ellipse 60% 60% at 0% 100%, #444 0%, #222 60%, #000 100%)',
      }}
    >
      <div className={styles.card}>
        <h1 className={styles.title}>Start API Request Demo - Names List</h1>
        <ul className={`${styles.list} ${styles.listTight} ${styles.listMarginBottom}`}>
          {names.map((name) => (
            <li key={name} className={`${styles.listItem} ${styles.listItemSmall}`}>
              <span className={styles.itemNamePlain}>{name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

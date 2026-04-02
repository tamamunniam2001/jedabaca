'use client'
import styles from './Header.module.css'

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <h1 className={styles.title}>Jeda Baca</h1>
        <p className={styles.tagline}>Jelajahi dunia novel tanpa batas</p>
      </div>
    </header>
  )
}

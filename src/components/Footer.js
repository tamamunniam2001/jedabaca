import Link from 'next/link'
import styles from './Footer.module.css'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>Jeda Baca</Link>
            <p className={styles.tagline}>Platform membaca dan berbagi novel Indonesia.</p>
            <a
              href="https://www.instagram.com/jeda.renung/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.instagram}
            >
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="1.8"/>
                <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
              </svg>
              <span>@jeda.renung</span>
            </a>
          </div>

          <div className={styles.links}>
            <div className={styles.linkGroup}>
              <p className={styles.groupTitle}>Jelajahi</p>
              <Link href="/explore" className={styles.link}>Semua Novel</Link>
              <Link href="/genres" className={styles.link}>Genre</Link>
              <Link href="/authors" className={styles.link}>Penulis</Link>
            </div>
            <div className={styles.linkGroup}>
              <p className={styles.groupTitle}>Akun</p>
              <Link href="/auth" className={styles.link}>Masuk</Link>
              <Link href="/auth?tab=register" className={styles.link}>Daftar</Link>
              <Link href="/dashboard" className={styles.link}>Dasbor Penulis</Link>
            </div>
            <div className={styles.linkGroup}>
              <p className={styles.groupTitle}>Legal</p>
              <Link href="/terms" className={styles.link}>Syarat Penggunaan</Link>
              <Link href="/privacy" className={styles.link}>Kebijakan Privasi</Link>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copy}>© {year} Jeda Baca. Seluruh hak cipta dilindungi.</p>
          <div className={styles.legalLinks}>
            <Link href="/terms" className={styles.legalLink}>Syarat Penggunaan</Link>
            <span className={styles.dot}>·</span>
            <Link href="/privacy" className={styles.legalLink}>Kebijakan Privasi</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

'use client'
import Recommendation from '@/components/Recommendation'
import NovelList from '@/components/NovelList'
import styles from './page.module.css'

export default function HomePage() {
  return (
    <main className={styles.main}>
      <Recommendation />
      <NovelList />
    </main>
  )
}

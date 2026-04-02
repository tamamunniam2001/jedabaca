'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import styles from './page.module.css'

const GENRE_LIST = [
  { name: 'Romance', emoji: '💕' },
  { name: 'Fantasy', emoji: '🧙' },
  { name: 'Horror', emoji: '👻' },
  { name: 'Mystery', emoji: '🔍' },
  { name: 'Drama', emoji: '🎭' },
  { name: 'Action', emoji: '⚔️' },
  { name: 'Comedy', emoji: '😄' },
  { name: 'Slice of Life', emoji: '🌿' },
  { name: 'Thriller', emoji: '😰' },
]

export default function GenresPage() {
  const [counts, setCounts] = useState({})
  const [covers, setCovers] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('novels')
        .select('genre, cover_image_url')
        .eq('publish_status', 'published')
        .not('genre', 'is', null)

      const c = {}, cv = {}
      data?.forEach(n => {
        if (!n.genre) return
        c[n.genre] = (c[n.genre] || 0) + 1
        if (!cv[n.genre] && n.cover_image_url) cv[n.genre] = n.cover_image_url
      })
      setCounts(c)
      setCovers(cv)
      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>Genre</h1>
          <p className={styles.subtitle}>Temukan e-book berdasarkan genre favorit Anda</p>
        </div>

        {loading ? (
          <div className={styles.loading}>Memuat...</div>
        ) : (
          <div className={styles.grid}>
            {GENRE_LIST.map(g => (
              <Link key={g.name} href={`/explore?genre=${encodeURIComponent(g.name)}`} className={styles.card}>
                <div className={styles.cardBg}>
                  {covers[g.name]
                    ? <img src={covers[g.name]} alt={g.name} className={styles.bgImg} />
                    : <div className={styles.bgPlaceholder}>{g.emoji}</div>
                  }
                  <div className={styles.overlay} />
                </div>
                <div className={styles.cardContent}>
                  <span className={styles.emoji}>{g.emoji}</span>
                  <h3 className={styles.genreName}>{g.name}</h3>
                  <p className={styles.count}>{counts[g.name] || 0} e-book</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

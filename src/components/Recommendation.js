'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import NovelCard from './NovelCard'
import styles from './Recommendation.module.css'

export default function Recommendation() {
  const [novels, setNovels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('novels').select('*, profiles!author_id(full_name, username)')
      .eq('publish_status', 'published')
      .order('rating', { ascending: false }).limit(6)
      .then(({ data }) => { setNovels(data || []); setLoading(false) })
  }, [])

  if (loading || novels.length === 0) return null

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Rekomendasi</h2>
          <p className={styles.subtitle}>E-book terpopuler minggu ini</p>
        </div>
        <div className={styles.grid}>
          {novels.map((novel, i) => <NovelCard key={novel.id} novel={novel} priority={i < 3} />)}
        </div>
      </div>
    </section>
  )
}

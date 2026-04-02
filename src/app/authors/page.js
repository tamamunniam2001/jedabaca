'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import styles from './page.module.css'

export default function AuthorsPage() {
  const [authors, setAuthors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchAuthors = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, bio, role')
        .in('role', ['author', 'admin'])
        .order('full_name', { ascending: true })
      // Fetch novel count per author
      const withCount = await Promise.all((data || []).map(async a => {
        const { count } = await supabase.from('novels')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', a.id).eq('publish_status', 'published')
        return { ...a, novelCount: count || 0 }
      }))
      setAuthors(withCount)
      setLoading(false)
    }
    fetchAuthors()
  }, [])

  const filtered = authors.filter(a => {
    const name = (a.full_name || a.username || '').toLowerCase()
    return name.includes(search.toLowerCase())
  })

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>Penulis</h1>
          <p className={styles.subtitle}>Temukan penulis favorit Anda</p>
          <input
            className={styles.search}
            type="text"
            placeholder="Cari penulis..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className={styles.empty}>Memuat daftar penulis...</p>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>Tidak ada penulis ditemukan.</p>
        ) : (
          <div className={styles.grid}>
            {filtered.map(author => (
              <Link key={author.id} href={`/authors/${author.id}`} className={styles.card}>
                <div className={styles.avatar}>
                  {author.avatar_url ? (
                    <img src={author.avatar_url} alt={author.full_name} />
                  ) : (
                    <div className={styles.avatarInitial}>{(author.full_name || author.username || '?')[0].toUpperCase()}</div>
                  )}
                </div>
                <h3 className={styles.name}>{author.full_name || author.username}</h3>
                <p className={styles.bio}>{author.bio || 'Penulis Jeda Baca'}</p>
                <span className={styles.bookCount}>{author.novelCount} e-book</span>
                <span className={styles.viewBtn}>Lihat Profil →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

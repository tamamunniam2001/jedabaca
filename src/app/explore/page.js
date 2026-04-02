'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import NovelCard from '@/components/NovelCard'
import styles from './page.module.css'

const GENRES = ['Semua', 'Romance', 'Fantasy', 'Horror', 'Mystery', 'Drama', 'Action', 'Comedy', 'Slice of Life', 'Thriller']
const ITEMS_PER_PAGE = 18

function ExploreContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [novels, setNovels] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  const q = searchParams.get('q') || ''
  const genre = searchParams.get('genre') || 'Semua'
  const sort = searchParams.get('sort') || 'terbaru'
  const [search, setSearch] = useState(q)

  const updateParams = (updates) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => v ? params.set(k, v) : params.delete(k))
    router.push(`/explore?${params.toString()}`)
    setPage(1)
  }

  useEffect(() => { setSearch(q) }, [q])

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const from = (page - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      let query = supabase.from('novels').select('*', { count: 'exact' })
        .eq('publish_status', 'published')

      if (q) query = query.ilike('title', `%${q}%`)
      if (genre && genre !== 'Semua') query = query.eq('genre', genre)

      if (sort === 'rating') query = query.order('rating', { ascending: false })
      else if (sort === 'views') query = query.order('views', { ascending: false })
      else query = query.order('created_at', { ascending: false })

      const { data, count } = await query.range(from, to)
      setNovels(data || [])
      setTotal(count || 0)
      setLoading(false)
    }
    fetch()
  }, [q, genre, sort, page])

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>Jelajahi E-book</h1>
          <p className={styles.subtitle}>{total} e-book tersedia</p>
        </div>

        <div className={styles.controls}>
          <form onSubmit={e => { e.preventDefault(); updateParams({ q: search }) }} className={styles.searchWrap}>
            <input
              className={styles.searchInput}
              placeholder="Cari judul atau penulis..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit" className={styles.searchBtn}>Cari</button>
          </form>
          <select className={styles.sortSelect} value={sort} onChange={e => updateParams({ sort: e.target.value })}>
            <option value="terbaru">Terbaru</option>
            <option value="rating">Rating Tertinggi</option>
            <option value="views">Paling Banyak Dibaca</option>
          </select>
        </div>

        <div className={styles.genreFilter}>
          {GENRES.map(g => (
            <button
              key={g}
              className={`${styles.genreBtn} ${(genre === g || (g === 'Semua' && !genre)) ? styles.genreActive : ''}`}
              onClick={() => updateParams({ genre: g === 'Semua' ? '' : g })}
            >{g}</button>
          ))}
        </div>

        {loading ? (
          <div className={styles.loading}>Memuat...</div>
        ) : novels.length === 0 ? (
          <div className={styles.empty}>Tidak ada e-book ditemukan.</div>
        ) : (
          <>
            <div className={styles.grid}>
              {novels.map(novel => <NovelCard key={novel.id} novel={novel} />)}
            </div>
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Sebelumnya</button>
                <span className={styles.pageInfo}>{page} / {totalPages}</span>
                <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Selanjutnya →</button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem' }}>Memuat...</div>}>
      <ExploreContent />
    </Suspense>
  )
}

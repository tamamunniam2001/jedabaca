'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import styles from './page.module.css'

export default function KoleksiPage() {
  const router = useRouter()
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [removing, setRemoving] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }
      setUser(session.user)

      const { data } = await supabase
        .from('bookmarks')
        .select(`
          id, created_at, novel_id, chapter_id,
          novels(id, title, slug, cover_image_url, author, genre, status, rating, views),
          chapters(id, chapter_number, title)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      // Fetch total chapter count per novel
      const novelIds = [...new Set((data || []).map(b => b.novel_id).filter(Boolean))]
      const chapterCounts = {}
      if (novelIds.length) {
        const { data: counts } = await supabase
          .from('chapters')
          .select('novel_id')
          .in('novel_id', novelIds)
        counts?.forEach(c => {
          chapterCounts[c.novel_id] = (chapterCounts[c.novel_id] || 0) + 1
        })
      }

      setBookmarks((data || []).map(b => ({ ...b, totalChapters: chapterCounts[b.novel_id] || 0 })))
      setLoading(false)
    }
    init()
  }, [router])

  const removeBookmark = async (bmId, novelTitle) => {
    if (!confirm(`Hapus "${novelTitle}" dari koleksi?`)) return
    setRemoving(bmId)
    await supabase.from('bookmarks').delete().eq('id', bmId)
    setBookmarks(prev => prev.filter(b => b.id !== bmId))
    setRemoving(null)
  }

  const filtered = bookmarks.filter(bm => {
    const q = search.toLowerCase()
    const n = bm.novels
    return (n?.title || '').toLowerCase().includes(q) ||
      (n?.author || '').toLowerCase().includes(q) ||
      (n?.genre || '').toLowerCase().includes(q)
  })

  const formatViews = (n) => {
    if (!n) return '0'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return String(n)
  }

  if (loading) return (
    <div className={styles.loadingWrap}>
      <div className={styles.loadingSpinner} />
      <p>Memuat koleksi...</p>
    </div>
  )

  return (
    <main className={styles.main}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.container}>
          <div className={styles.headerTop}>
            <div>
              <h1 className={styles.title}>Koleksi Saya</h1>
              <p className={styles.subtitle}>{bookmarks.length} e-book tersimpan</p>
            </div>
            <Link href="/profile" className={styles.backBtn}>← Profil</Link>
          </div>

          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className={styles.searchInput}
              placeholder="Cari judul, penulis, atau genre..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.clearSearch} onClick={() => setSearch('')}>✕</button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.container}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📚</div>
            <h3 className={styles.emptyTitle}>
              {search ? 'Tidak ada hasil' : 'Koleksi masih kosong'}
            </h3>
            <p className={styles.emptyDesc}>
              {search
                ? `Tidak ada e-book yang cocok dengan "${search}"`
                : 'Mulai tambahkan e-book favorit ke koleksi Anda'}
            </p>
            {!search && (
              <Link href="/explore" className={styles.exploreBtn}>Jelajahi E-book</Link>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map(bm => {
              const novel = bm.novels
              const chapter = bm.chapters
              const slug = novel?.slug || novel?.id
              const rating = novel?.rating || 0
              const fullStars = Math.floor(rating)
              const readHref = chapter
                ? `/ebook/${slug}/chapter/${chapter.id}`
                : `/ebook/${slug}`
              const progressPct = chapter && bm.totalChapters
                ? Math.round((chapter.chapter_number / bm.totalChapters) * 100)
                : null

              return (
                <div key={bm.id} className={styles.card}>
                  {/* Cover */}
                  <Link href={readHref} className={styles.coverLink}>
                    <div className={styles.coverWrap}>
                      {novel?.cover_image_url
                        ? <img src={novel.cover_image_url} alt={novel.title} className={styles.cover} />
                        : (
                          <div className={styles.coverPlaceholder}>
                            <span>{novel?.title?.[0]?.toUpperCase()}</span>
                          </div>
                        )}
                      <div className={styles.coverOverlay}>
                        <span className={styles.readNow}>
                          {chapter ? 'Lanjut Baca' : 'Baca Sekarang'}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Info */}
                  <div className={styles.cardBody}>
                    {novel?.genre && <span className={styles.genre}>{novel.genre}</span>}
                    <Link href={`/ebook/${slug}`} className={styles.novelTitle}>
                      {novel?.title}
                    </Link>
                    <p className={styles.author}>{novel?.author}</p>

                    {/* Rating */}
                    {rating > 0 && (
                      <div className={styles.ratingRow}>
                        <div className={styles.stars}>
                          {[1,2,3,4,5].map(s => (
                            <svg key={s} width="12" height="12" viewBox="0 0 24 24"
                              fill={s <= fullStars ? '#f5a623' : '#e0e0e0'}>
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          ))}
                        </div>
                        <span className={styles.ratingNum}>{rating.toFixed(1)}</span>
                      </div>
                    )}

                    {/* Stats */}
                    <div className={styles.statsRow}>
                      <span className={styles.stat}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                        {formatViews(novel?.views)}
                      </span>
                      {novel?.status && (
                        <span className={`${styles.statusBadge} ${styles['status_' + novel.status]}`}>
                          {novel.status === 'completed' ? 'Tamat' : novel.status === 'ongoing' ? 'Berlanjut' : novel.status}
                        </span>
                      )}
                    </div>

                    <p className={styles.savedDate}>
                      Disimpan {new Date(bm.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>

                    {/* Chapter progress */}
                    {chapter && (
                      <div className={styles.chapterProgress}>
                        <div className={styles.chapterProgressTop}>
                          <span className={styles.chapterLabel}>
                            Bab {chapter.chapter_number}: {chapter.title}
                          </span>
                          {progressPct !== null && (
                            <span className={styles.progressPct}>{progressPct}%</span>
                          )}
                        </div>
                        {progressPct !== null && (
                          <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
                          </div>
                        )}
                        {bm.totalChapters > 0 && (
                          <span className={styles.totalChapters}>
                            {chapter.chapter_number} / {bm.totalChapters} bab
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className={styles.cardFooter}>
                    <Link href={readHref} className={styles.readBtn}>
                      {chapter ? 'Lanjut Baca' : 'Baca'}
                    </Link>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeBookmark(bm.id, novel?.title)}
                      disabled={removing === bm.id}
                      title="Hapus dari koleksi"
                    >
                      {removing === bm.id
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.spin}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      }
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

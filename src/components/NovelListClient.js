'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import NovelCard from './NovelCard'
import styles from './NovelList.module.css'

const ITEMS_PER_PAGE = 12

export default function NovelListClient({ initialNovels, initialTotal }) {
  const [novels, setNovels] = useState(initialNovels)
  const [totalItems, setTotalItems] = useState(initialTotal)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  const goToPage = async (page) => {
    if (page === currentPage) return
    setLoading(true)
    const from = (page - 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1
    const { data, count } = await supabase
      .from('novels')
      .select('id, title, slug, cover_image_url, author, genre, rating, publish_status, profiles!author_id(full_name, username)', { count: 'exact' })
      .eq('publish_status', 'published')
      .order('created_at', { ascending: false })
      .range(from, to)
    setNovels(data || [])
    if (count !== null) setTotalItems(count)
    setCurrentPage(page)
    setLoading(false)
    window.scrollTo({ top: document.getElementById('novel-list')?.offsetTop - 80 || 0, behavior: 'smooth' })
  }

  const getPaginationPages = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  return (
    <section className={styles.section} id="novel-list">
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Semua E-book</h2>
          <p className={styles.subtitle}>Jelajahi koleksi lengkap kami</p>
        </div>

        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonCover} />
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLineShort} />
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.grid}>
            {novels.map(novel => <NovelCard key={novel.id} novel={novel} />)}
          </div>
        )}

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button className={styles.paginationBtn} onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1 || loading}>
              ← Sebelumnya
            </button>
            <div className={styles.pageNumbers}>
              {currentPage > 1 && <button className={styles.pageBtn} onClick={() => goToPage(1)}>1</button>}
              {currentPage > 3 && <span className={styles.ellipsis}>...</span>}
              {getPaginationPages().map(page => (
                <button key={page} className={`${styles.pageBtn} ${page === currentPage ? styles.active : ''}`} onClick={() => goToPage(page)}>{page}</button>
              ))}
              {currentPage < totalPages - 2 && <span className={styles.ellipsis}>...</span>}
              {currentPage < totalPages && <button className={styles.pageBtn} onClick={() => goToPage(totalPages)}>{totalPages}</button>}
            </div>
            <button className={styles.paginationBtn} onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || loading}>
              Selanjutnya →
            </button>
          </div>
        )}

        <div className={styles.info}>
          Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} dari {totalItems} e-book
        </div>
      </div>
    </section>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import NovelCard from './NovelCard'
import styles from './NovelList.module.css'

const ITEMS_PER_PAGE = 12

export default function NovelList() {
  const [novels, setNovels] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        setLoading(true)
        const from = (currentPage - 1) * ITEMS_PER_PAGE
        const to = from + ITEMS_PER_PAGE - 1

        const { data, error, count } = await supabase
          .from('novels')
          .select('*, profiles!author_id(full_name, username)', { count: 'exact' })
          .eq('publish_status', 'published')
          .not('publish_status', 'is', null)
          .order('created_at', { ascending: false })
          .range(from, to)

        if (error) throw error
        setNovels(data || [])
        setTotalItems(count || 0)
      } catch (error) {
        console.error('Error fetching novels:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNovels()
  }, [currentPage])

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePageClick = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getPaginationPages = () => {
    const pages = []
    const maxVisible = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let endPage = Math.min(totalPages, startPage + maxVisible - 1)

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }

  return (
    <section className={styles.section}>
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
        ) : novels.length === 0 ? (
          <div className={styles.empty}>Belum ada e-book tersedia</div>
        ) : (
          <>
            <div className={styles.grid}>
              {novels.map(novel => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>

            {/* Pagination */}
            <div className={styles.pagination}>
              <button
                className={styles.paginationBtn}
                onClick={handlePrevious}
                disabled={currentPage === 1}
              >
                ← Sebelumnya
              </button>

              <div className={styles.pageNumbers}>
                {currentPage > 1 && (
                  <button
                    className={styles.pageBtn}
                    onClick={() => handlePageClick(1)}
                  >
                    1
                  </button>
                )}

                {currentPage > 3 && (
                  <span className={styles.ellipsis}>...</span>
                )}

                {getPaginationPages().map(page => (
                  <button
                    key={page}
                    className={`${styles.pageBtn} ${
                      page === currentPage ? styles.active : ''
                    }`}
                    onClick={() => handlePageClick(page)}
                  >
                    {page}
                  </button>
                ))}

                {currentPage < totalPages - 2 && (
                  <span className={styles.ellipsis}>...</span>
                )}

                {currentPage < totalPages && (
                  <button
                    className={styles.pageBtn}
                    onClick={() => handlePageClick(totalPages)}
                  >
                    {totalPages}
                  </button>
                )}
              </div>

              <button
                className={styles.paginationBtn}
                onClick={handleNext}
                disabled={currentPage === totalPages}
              >
                Selanjutnya →
              </button>
            </div>

            <div className={styles.info}>
              Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} dari {totalItems} e-book
            </div>
          </>
        )}
      </div>
    </section>
  )
}

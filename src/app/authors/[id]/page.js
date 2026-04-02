'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import NovelCard from '@/components/NovelCard'
import ReviewCard from '@/components/ReviewCard'
import ContactForm from '@/components/ContactForm'
import styles from './page.module.css'

export default function AuthorPage() {
  const params = useParams()
  const [author, setAuthor] = useState(null)
  const [novels, setNovels] = useState([])
  const [reviews, setReviews] = useState([])
  const [activeTab, setActiveTab] = useState('books')
  const [showContactForm, setShowContactForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAuthorData = async () => {
      try {
        setLoading(true)

        const { data: authorData, error: authorError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', params.id)
          .single()

        if (authorError) throw authorError

        const { data: novelsData } = await supabase
          .from('novels')
          .select('*')
          .eq('author', authorData.full_name || authorData.username)
          .order('created_at', { ascending: false })

        const novelIds = (novelsData || []).map(n => n.id)
        let reviewsData = []

        if (novelIds.length > 0) {
          const { data: chapterIds } = await supabase
            .from('chapters')
            .select('id')
            .in('novel_id', novelIds)

          if (chapterIds?.length > 0) {
            const { data: reviewsResult } = await supabase
              .from('comments')
              .select('*, profiles(username, avatar_url)')
              .in('chapter_id', chapterIds.map(c => c.id))
              .order('created_at', { ascending: false })
              .limit(10)

            reviewsData = reviewsResult || []
          }
        }

        setAuthor(authorData)
        setNovels(novelsData || [])
        setReviews(reviewsData)
      } catch (error) {
        console.error('Error fetching author data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) fetchAuthorData()
  }, [params.id])

  if (loading) return <div className={styles.loading}>Memuat profil penulis...</div>
  if (!author) return <div className={styles.loading}>Penulis tidak ditemukan</div>

  return (
    <main className={styles.main}>
      <section className={styles.headerSection}>
        <div className={styles.container}>
          <div className={styles.headerContent}>
            <div className={styles.profileImage}>
              {author.avatar_url ? (
                <img src={author.avatar_url} alt={author.full_name} />
              ) : (
                <div className={styles.placeholderAvatar}>👤</div>
              )}
            </div>
            <div className={styles.authorInfo}>
              <h1 className={styles.authorName}>{author.full_name || author.username}</h1>
              <p className={styles.authorBio}>{author.bio || 'Penulis berbakat yang mencintai bercerita.'}</p>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{novels.length}</span>
                  <span className={styles.statLabel}>Buku</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{reviews.length}</span>
                  <span className={styles.statLabel}>Review</span>
                </div>
              </div>
              <button className={styles.contactBtn} onClick={() => setShowContactForm(true)}>
                💬 Hubungi Penulis
              </button>
            </div>
          </div>
        </div>
      </section>

      {showContactForm && (
        <ContactForm
          authorId={author.id}
          authorName={author.full_name || author.username}
          onClose={() => setShowContactForm(false)}
        />
      )}

      <section className={styles.tabsSection}>
        <div className={styles.container}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'books' ? styles.active : ''}`}
              onClick={() => setActiveTab('books')}
            >
              📚 Buku Saya ({novels.length})
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'reviews' ? styles.active : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              ⭐ Review Pembaca ({reviews.length})
            </button>
          </div>

          {activeTab === 'books' && (
            <div className={styles.tabContent}>
              {novels.length === 0 ? (
                <p className={styles.emptyTab}>Penulis ini belum menerbitkan buku.</p>
              ) : (
                <div className={styles.booksGrid}>
                  {novels.map(novel => <NovelCard key={novel.id} novel={novel} />)}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className={styles.tabContent}>
              {reviews.length === 0 ? (
                <p className={styles.emptyTab}>Belum ada review untuk buku penulis ini.</p>
              ) : (
                <div className={styles.reviewsList}>
                  {reviews.map(review => <ReviewCard key={review.id} review={review} />)}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import styles from './page.module.css'

export default function NovelPage() {
  const params = useParams()
  const router = useRouter()
  const [novel, setNovel] = useState(null)
  const [chapters, setChapters] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }
    checkUser()
  }, [])

  useEffect(() => {
    const fetchNovel = async () => {
      try {
        const slugOrId = params.slug

        // Coba query by slug dulu, fallback ke id
        let { data, error } = await supabase
          .from('novels')
          .select('*')
          .eq('slug', slugOrId)
          .single()

        if (error || !data) {
          const res = await supabase
            .from('novels')
            .select('*')
            .eq('id', slugOrId)
            .single()
          data = res.data
          if (res.error) throw res.error

          // Redirect ke slug jika ada
          if (data?.slug) {
            router.replace(`/novel/${data.slug}`)
            return
          }
        }

        setNovel(data)

        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('*')
          .eq('novel_id', data.id)
          .order('chapter_number', { ascending: true })

        if (chaptersError) throw chaptersError
        setChapters(chaptersData || [])
      } catch (error) {
        console.error('Error fetching novel:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.slug) fetchNovel()
  }, [params.slug, router])

  const handleReadClick = () => router.push('/auth')

  const isOwner = user && novel && user.id === novel.author_id
  const novelSlug = novel?.slug || novel?.id

  if (loading) return <div className={styles.container}><div className={styles.loading}>Memuat...</div></div>
  if (!novel) return <div className={styles.container}><div className={styles.empty}>E-book tidak ditemukan</div></div>

  return (
    <main className={styles.main}>
      <section className={styles.headerSection}>
        <div className={styles.container}>
          <Link href="/" className={styles.backBtn}>← Kembali</Link>

          <div className={styles.headerContent}>
            <div className={styles.coverImage}>
              {novel.cover_image_url ? (
                <img src={novel.cover_image_url} alt={novel.title} />
              ) : (
                <div className={styles.placeholderCover}></div>
              )}
            </div>

            <div className={styles.novelInfo}>
              <h1 className={styles.title}>{novel.title}</h1>
              <p className={styles.author}>Oleh {novel.author}</p>

              <div className={styles.meta}>
                <span className={styles.status}>{novel.status}</span>
                {novel.genre && <span className={styles.genre}>{novel.genre}</span>}
              </div>

              {novel.description && (
                <p className={styles.description}>{novel.description}</p>
              )}

              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{chapters.length}</span>
                  <span className={styles.statLabel}>Bab</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{novel.views || 0}</span>
                  <span className={styles.statLabel}>Views</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{novel.rating?.toFixed(1) || '0.0'}</span>
                  <span className={styles.statLabel}>Rating</span>
                </div>
              </div>

              {!user && (
                <div className={styles.loginPrompt}>
                  <p>Silakan login untuk membaca e-book ini</p>
                  <Link href="/auth" className={styles.loginBtn}>Masuk / Daftar</Link>
                </div>
              )}

              {isOwner && (
                <div className={styles.ownerActions}>
                  <Link href={`/dashboard/novel/${novel.id}`} className={styles.editBtn}>
                    Edit E-book
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.chaptersSection}>
        <div className={styles.container}>
          <h2 className={styles.chaptersTitle}>Daftar Bab ({chapters.length})</h2>

          {chapters.length === 0 ? (
            <div className={styles.emptyChapters}>
              <p>Belum ada bab yang dipublikasikan</p>
            </div>
          ) : (
            <div className={styles.chaptersList}>
              {chapters.map(chapter => (
                <div key={chapter.id} className={styles.chapterItem}>
                  <div className={styles.chapterInfo}>
                    <h3 className={styles.chapterNumber}>Bab {chapter.chapter_number}</h3>
                    <p className={styles.chapterTitle}>{chapter.title}</p>
                    <p className={styles.chapterDate}>
                      {new Date(chapter.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div className={styles.chapterActions}>
                    {isOwner && (
                      <Link href={`/dashboard/novel/${novel.id}?chapter=${chapter.id}`} className={styles.editChapterBtn}>
                        Edit
                      </Link>
                    )}
                    <Link
                      href={user ? `/novel/${novelSlug}/chapter/${chapter.id}` : '/auth'}
                      className={styles.readLink}
                      onClick={(e) => { if (!user) { e.preventDefault(); handleReadClick() } }}
                    >
                      {user ? 'Baca' : 'Login untuk Baca'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import styles from './page.module.css'

export default function EbookPage() {
  const params = useParams()
  const router = useRouter()
  const [novel, setNovel] = useState(null)
  const [chapters, setChapters] = useState([])
  const [user, setUser] = useState(null)
  const [authorName, setAuthorName] = useState('')
  const [loading, setLoading] = useState(true)
  const [inLibrary, setInLibrary] = useState(false)
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [reviews, setReviews] = useState([])
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [ratingCount, setRatingCount] = useState(0)
  const [avgRating, setAvgRating] = useState(0)

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
        let { data, error } = await supabase.from('novels').select('*').eq('slug', slugOrId).single()
        if (error || !data) {
          const res = await supabase.from('novels').select('*').eq('id', slugOrId).single()
          data = res.data
          if (res.error) throw res.error
          if (data?.slug) { router.replace(`/ebook/${data.slug}`); return }
        }
        setNovel(data)

        // Track view
        await supabase.from('novels').update({ views: (data.views || 0) + 1 }).eq('id', data.id)

        // Fetch author name from profiles
        if (data.author_id) {
          const { data: profile } = await supabase
            .from('profiles').select('full_name, username').eq('id', data.author_id).single()
          setAuthorName(profile?.full_name || profile?.username || data.author)
        } else {
          setAuthorName(data.author)
        }

        // Fetch chapters (published only)
        const { data: chaptersData } = await supabase
          .from('chapters').select('*').eq('novel_id', data.id)
          .eq('publish_status', 'published')
          .order('chapter_number', { ascending: true })
        setChapters(chaptersData || [])

        // Fetch ratings & reviews
        await fetchRatings(data.id)
      } catch (err) {
        console.error('Error fetching ebook:', err)
      } finally {
        setLoading(false)
      }
    }
    if (params.slug) fetchNovel()
  }, [params.slug, router])

  const fetchRatings = async (novelId) => {
    const { data: ratingsData, error } = await supabase
      .from('ratings')
      .select('user_id, rating, review, created_at')
      .eq('novel_id', novelId)
      .order('created_at', { ascending: false })

    if (error) { console.error('ratings error:', error); return }
    if (!ratingsData?.length) return

    // Fetch profile names separately
    const userIds = [...new Set(ratingsData.map(r => r.user_id))]
    const { data: profilesData } = await supabase
      .from('profiles').select('id, full_name, username').in('id', userIds)
    const profileMap = {}
    profilesData?.forEach(p => { profileMap[p.id] = p.full_name || p.username || 'Pembaca' })

    const enriched = ratingsData.map(r => ({ ...r, authorName: profileMap[r.user_id] || 'Pembaca' }))
    const avg = enriched.reduce((s, r) => s + r.rating, 0) / enriched.length
    setAvgRating(avg)
    setRatingCount(enriched.length)
    setReviews(enriched.filter(r => r.review))
  }

  // Check if in library & user's existing rating
  useEffect(() => {
    if (!user || !novel) return
    const checkLibrary = async () => {
      const { data } = await supabase.from('bookmarks')
        .select('id').eq('user_id', user.id).eq('novel_id', novel.id).maybeSingle()
      setInLibrary(!!data)
    }
    const checkRating = async () => {
      const { data } = await supabase.from('ratings')
        .select('rating, review').eq('user_id', user.id).eq('novel_id', novel.id).maybeSingle()
      if (data) { setUserRating(data.rating); setReviewText(data.review || '') }
    }
    checkLibrary()
    checkRating()
  }, [user, novel])

  const toggleLibrary = async () => {
    if (!user) { router.push('/auth'); return }
    setLibraryLoading(true)
    if (inLibrary) {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('novel_id', novel.id)
      setInLibrary(false)
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, novel_id: novel.id })
      setInLibrary(true)
    }
    setLibraryLoading(false)
  }

  const submitRating = async () => {
    if (!user) { router.push('/auth'); return }
    if (!userRating) return
    setReviewLoading(true)

    const { data: existing } = await supabase.from('ratings')
      .select('id').eq('user_id', user.id).eq('novel_id', novel.id).maybeSingle()

    const payload = { rating: userRating, review: reviewText || null }
    let err
    if (existing) {
      const { error } = await supabase.from('ratings').update(payload)
        .eq('user_id', user.id).eq('novel_id', novel.id)
      err = error
    } else {
      const { error } = await supabase.from('ratings')
        .insert({ user_id: user.id, novel_id: novel.id, ...payload })
      err = error
    }

    if (err) { console.error('submit rating error:', err); setReviewLoading(false); return }

    await fetchRatings(novel.id)
    // Update avg rating on novel
    const { data: all } = await supabase.from('ratings').select('rating').eq('novel_id', novel.id)
    if (all?.length) {
      const avg = all.reduce((s, r) => s + r.rating, 0) / all.length
      await supabase.from('novels').update({ rating: parseFloat(avg.toFixed(2)) }).eq('id', novel.id)
    }
    setReviewLoading(false)
  }

  const isOwner = user && novel && user.id === novel.author_id
  const ebookSlug = novel?.slug || novel?.id
  const firstChapter = chapters[0]
  const rating = avgRating || novel?.rating || 0
  const fullStars = Math.floor(rating)
  const halfStar = rating - fullStars >= 0.5

  const formatViews = (n) => {
    if (!n) return '0'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toString()
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  if (loading) return <div className={styles.container}><div className={styles.loading}>Memuat...</div></div>
  if (!novel) return <div className={styles.container}><div className={styles.empty}>E-book tidak ditemukan</div></div>

  return (
    <main className={styles.main}>
      <section className={styles.headerSection}>
        <div className={styles.container}>
          <Link href="/" className={styles.backBtn}>← Kembali</Link>
          <div className={styles.headerContent}>
            <div className={styles.coverWrap}>
              {novel.cover_image_url
                ? <img src={novel.cover_image_url} alt={novel.title} className={styles.coverImg} />
                : <div className={styles.placeholderCover} />}
            </div>
            <div className={styles.novelInfo}>
              <h1 className={styles.title}>{novel.title}</h1>
              <div className={styles.metaRow}>
                {novel.genre && <span className={styles.genre}>{novel.genre}</span>}
                {novel.updated_at && (
                  <span className={styles.updated}>
                    🕐 Last Updated : {new Date(novel.updated_at).toISOString().split('T')[0]}
                  </span>
                )}
              </div>
              <div className={styles.authorRow}>
                <span className={styles.byLabel}>By:</span>
                <span className={styles.authorName}>{authorName}</span>
                {novel.status && <span className={styles.statusBadge}>{novel.status}</span>}
              </div>

              <div className={styles.ratingRow}>
                <span className={styles.ratingScore}>{rating.toFixed(1)}</span>
                <div className={styles.stars}>
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} width="20" height="20" viewBox="0 0 24 24"
                      fill={i <= fullStars ? '#f5a623' : (i === fullStars + 1 && halfStar ? 'url(#half)' : '#ddd')}>
                      <defs>
                        <linearGradient id="half"><stop offset="50%" stopColor="#f5a623"/><stop offset="50%" stopColor="#ddd"/></linearGradient>
                      </defs>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <span className={styles.ratingMeta}>{ratingCount} ratings · {reviews.length} reviews</span>
                <div className={styles.statDivider} />
                <div className={styles.statBlock}>
                  <span className={styles.statNum}>{chapters.length}</span>
                  <span className={styles.statLbl}>Chapters</span>
                </div>
                <div className={styles.statBlock}>
                  <span className={styles.statNum}>{formatViews((novel.views || 0) + 1)}</span>
                  <span className={styles.statLbl}>views</span>
                </div>
              </div>

              <div className={styles.actions}>
                <Link
                  href={firstChapter ? `/ebook/${ebookSlug}/chapter/${firstChapter.id}` : '/auth'}
                  className={styles.readBtn}
                >Baca</Link>
                <button onClick={toggleLibrary} disabled={libraryLoading} className={`${styles.bookmarkBtn} ${inLibrary ? styles.bookmarkActive : ''}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={inLibrary ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                  {inLibrary ? 'Tersimpan' : 'Tambah ke koleksi'}
                </button>
                {isOwner && (
                  <Link href={`/dashboard/buku/${novel.id}`} className={styles.editBtn}>Edit</Link>
                )}
              </div>

              <div className={styles.shareRow}>
                <span className={styles.shareLabel}>Share:</span>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className={`${styles.shareBtn} ${styles.fb}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
                </a>
                <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(novel.title)}`} target="_blank" rel="noreferrer" className={`${styles.shareBtn} ${styles.tw}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href={`https://wa.me/?text=${encodeURIComponent(novel.title + ' ' + shareUrl)}`} target="_blank" rel="noreferrer" className={`${styles.shareBtn} ${styles.wa}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
                <a href={`https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(novel.title)}`} target="_blank" rel="noreferrer" className={`${styles.shareBtn} ${styles.rd}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
                </a>
                <button onClick={() => navigator.clipboard?.writeText(shareUrl)} className={`${styles.shareBtn} ${styles.cp}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {novel.description && (
        <section className={styles.descSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Sinopsis</h2>
            <p className={styles.description}>{novel.description}</p>
          </div>
        </section>
      )}

      <section className={styles.chaptersSection}>
        <div className={styles.container}>
          <h2 className={styles.chaptersTitle}>Daftar Bab ({chapters.length})</h2>
          {chapters.length === 0 ? (
            <div className={styles.emptyChapters}><p>Belum ada bab yang dipublikasikan</p></div>
          ) : (
            <div className={styles.chaptersList}>
              {chapters.map(chapter => (
                <div key={chapter.id} className={styles.chapterItem}>
                  <div className={styles.chapterInfo}>
                    <p className={styles.chapterTitle}>{chapter.title}</p>
                    <p className={styles.chapterDate}>{new Date(chapter.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div className={styles.chapterActions}>
                    {isOwner && (
                      <Link href={`/dashboard/buku/${novel.id}`} className={styles.editChapterBtn}>Edit</Link>
                    )}
                    <Link href={`/ebook/${ebookSlug}/chapter/${chapter.id}`} className={styles.readLink}>Baca</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Rating & Review Section */}
      <section className={styles.reviewSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Rating & Ulasan</h2>

          {user ? (
            <div className={styles.ratingForm}>
              <p className={styles.ratingFormLabel}>Beri rating:</p>
              <div className={styles.starInput}>
                {[1,2,3,4,5].map(i => (
                  <button key={i} type="button"
                    className={styles.starBtn}
                    onMouseEnter={() => setHoverRating(i)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setUserRating(i)}>
                    <svg width="28" height="28" viewBox="0 0 24 24"
                      fill={i <= (hoverRating || userRating) ? '#f5a623' : '#ddd'}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </button>
                ))}
                {userRating > 0 && <span className={styles.ratingSelected}>{userRating}/5</span>}
              </div>
              <textarea
                className={styles.reviewInput}
                placeholder="Tulis ulasan (opsional)..."
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                rows={3}
              />
              <button onClick={submitRating} disabled={!userRating || reviewLoading} className={styles.submitReview}>
                {reviewLoading ? 'Menyimpan...' : 'Kirim Ulasan'}
              </button>
            </div>
          ) : (
            <p className={styles.loginNote}>
              <Link href="/auth" className={styles.loginLink}>Login</Link> untuk memberi rating dan ulasan.
            </p>
          )}

          {reviews.length > 0 && (
            <div className={styles.reviewList}>
              {reviews.map((r, i) => (
                <div key={i} className={styles.reviewItem}>
                  <div className={styles.reviewHeader}>
                    <span className={styles.reviewAuthor}>
                      {r.authorName}
                    </span>
                    <div className={styles.reviewStars}>
                      {[1,2,3,4,5].map(s => (
                        <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill={s <= r.rating ? '#f5a623' : '#ddd'}>
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      ))}
                    </div>
                    <span className={styles.reviewDate}>{new Date(r.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                  <p className={styles.reviewText}>{r.review}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

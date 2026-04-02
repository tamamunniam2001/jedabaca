'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import styles from './page.module.css'

export default function ChapterPage() {
  const params = useParams()
  const router = useRouter()
  const [chapter, setChapter] = useState(null)
  const [allChapters, setAllChapters] = useState([])
  const [ebook, setEbook] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkMsg, setBookmarkMsg] = useState('')
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [rating, setRating] = useState(0)
  const [userRating, setUserRating] = useState(0)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [relatedEbooks, setRelatedEbooks] = useState([])
  const [authorName, setAuthorName] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('readerDark')
    if (saved === 'true') setDarkMode(true)
  }, [])

  const toggleDark = () => {
    setDarkMode(d => {
      localStorage.setItem('readerDark', String(!d))
      return !d
    })
  }

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/auth'); return }
      setUser(session.user)
    }
    checkUser()
  }, [router])

  useEffect(() => {
    const fetchChapter = async () => {
      try {
        const { data: chapterData, error: chapterError } = await supabase
          .from('chapters').select('*').eq('id', params.chapterId).single()
        if (chapterError) throw chapterError
        setChapter(chapterData)

        const [{ data: ebookData }, { data: chaptersData }] = await Promise.all([
          supabase.from('novels').select('*').eq('id', chapterData.novel_id).single(),
          supabase.from('chapters').select('id, chapter_number, title').eq('novel_id', chapterData.novel_id).order('chapter_number', { ascending: true }),
        ])
        setEbook(ebookData)
        setAllChapters(chaptersData || [])

        // Fetch author name, likes, rating, comments, related
        if (ebookData) {
          const [{ data: profileData }, { data: likesData }, { data: ratingsData }, { data: commentsData }, { data: relatedData }] = await Promise.all([
            supabase.from('profiles').select('full_name, username').eq('id', ebookData.author_id).single(),
            supabase.from('chapter_likes').select('id', { count: 'exact' }).eq('chapter_id', params.chapterId),
            supabase.from('chapter_ratings').select('rating').eq('chapter_id', params.chapterId),
            supabase.from('chapter_comments').select('id, content, created_at, user_id, profiles(full_name, username)').eq('chapter_id', params.chapterId).order('created_at', { ascending: true }),
            supabase.from('novels').select('id, title, slug, cover_image_url, author').neq('id', chapterData.novel_id).limit(4),
          ])
          setAuthorName(profileData?.full_name || profileData?.username || ebookData.author || '')
          setLikeCount(likesData?.length || 0)
          if (ratingsData?.length) {
            const avg = ratingsData.reduce((s, r) => s + r.rating, 0) / ratingsData.length
            setRating(Math.round(avg * 10) / 10)
          }
          setComments(commentsData || [])
          setRelatedEbooks(relatedData || [])

          // Cek like & rating user
          if (user) {
            const [{ data: myLike }, { data: myRating }] = await Promise.all([
              supabase.from('chapter_likes').select('id').eq('chapter_id', params.chapterId).eq('user_id', user.id).single(),
              supabase.from('chapter_ratings').select('rating').eq('chapter_id', params.chapterId).eq('user_id', user.id).single(),
            ])
            if (myLike) setLiked(true)
            if (myRating) setUserRating(myRating.rating)
          }
        }

        await supabase.from('chapters')
          .update({ views: (chapterData.views || 0) + 1 })
          .eq('id', params.chapterId)
      } catch (error) {
        console.error('Error fetching chapter:', error)
      } finally {
        setLoading(false)
      }
    }
    if (user && params.chapterId) fetchChapter()
  }, [user, params.chapterId])

  // Cek bookmark
  useEffect(() => {
    if (!user || !params.chapterId) return
    const key = `bookmark_${user.id}_${params.chapterId}`
    setBookmarked(localStorage.getItem(key) === 'true')
  }, [user, params.chapterId])

  const toggleBookmark = async () => {
    if (!user || !ebook) return
    const key = `bookmark_${user.id}_${params.chapterId}`
    const next = !bookmarked
    setBookmarked(next)
    localStorage.setItem(key, String(next))

    // Simpan ke tabel bookmarks jika ada, atau gunakan localStorage saja
    try {
      if (next) {
        await supabase.from('bookmarks').upsert({
          user_id: user.id,
          novel_id: ebook.id,
          chapter_id: params.chapterId,
        })
      } else {
        await supabase.from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('chapter_id', params.chapterId)
      }
    } catch (_) {}

    setBookmarkMsg(next ? 'Disimpan!' : 'Dihapus')
    setTimeout(() => setBookmarkMsg(''), 2000)
  }

  const toggleLike = async () => {
    if (!user) return
    const next = !liked
    setLiked(next)
    setLikeCount(c => next ? c + 1 : c - 1)
    try {
      if (next) await supabase.from('chapter_likes').upsert({ chapter_id: params.chapterId, user_id: user.id })
      else await supabase.from('chapter_likes').delete().eq('chapter_id', params.chapterId).eq('user_id', user.id)
    } catch (_) {}
  }

  const submitRating = async (val) => {
    if (!user) return
    setUserRating(val)
    try {
      await supabase.from('chapter_ratings').upsert({ chapter_id: params.chapterId, user_id: user.id, rating: val })
      const { data } = await supabase.from('chapter_ratings').select('rating').eq('chapter_id', params.chapterId)
      if (data?.length) setRating(Math.round(data.reduce((s, r) => s + r.rating, 0) / data.length * 10) / 10)
    } catch (_) {}
  }

  const submitComment = async () => {
    if (!user || !commentText.trim()) return
    setCommentLoading(true)
    try {
      const { data } = await supabase.from('chapter_comments')
        .insert({ chapter_id: params.chapterId, user_id: user.id, content: commentText.trim() })
        .select('id, content, created_at, user_id, profiles(full_name, username)').single()
      if (data) setComments(c => [...c, data])
      setCommentText('')
    } catch (_) {}
    setCommentLoading(false)
  }


  const currentIndex = allChapters.findIndex(c => c.id === params.chapterId)
  const prevChapter = allChapters[currentIndex - 1]
  const nextChapter = allChapters[currentIndex + 1]
  const ebookSlug = ebook?.slug || params.slug

  const cleanContent = (html) => html.replace(/(<br\s*\/?>){2,}/gi, '<br>')

  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareText = ebook ? `Baca "${ebook.title}" di Jeda Baca` : ''

  const shareLinks = [
    { label: 'WhatsApp', color: '#25D366', href: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + pageUrl)}`, icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    )},
    { label: 'Facebook', color: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`, icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
    )},
    { label: 'X', color: '#000', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`, icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    )},
    { label: 'Threads', color: '#000', href: `https://www.threads.net/intent/post?text=${encodeURIComponent(shareText + ' ' + pageUrl)}`, icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 013.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65zm.36-13.09c-.109 0-.22.003-.333.009-1.084.063-1.932.367-2.455.88-.434.418-.637.953-.601 1.553.069 1.258 1.396 1.974 3.049 1.884 1.22-.066 2.111-.49 2.648-1.261.387-.555.588-1.302.598-2.22a11.738 11.738 0 00-2.906-.845z"/></svg>
    )},
    { label: 'Instagram', color: '#E1306C', href: `https://www.instagram.com/`, icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
    )},
  ]

  if (loading) return <div className={styles.loadingWrap}><div className={styles.loading}>Memuat...</div></div>
  if (!chapter || !ebook) return <div className={styles.loadingWrap}><div className={styles.loading}>Bab tidak ditemukan</div></div>

  return (
    <main className={`${styles.main} ${darkMode ? styles.dark : ''}`}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href={`/buku/${ebookSlug}`} className={styles.backBtn}>← Kembali</Link>
          <div className={styles.headerMeta}>
            <span className={styles.ebookTitle}>{ebook.title}</span>
            <span className={styles.headerSep}>·</span>
            <span className={styles.chapterLabel}>Bab {chapter.chapter_number}: {chapter.title}</span>
          </div>

        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.readerContainer}>
          <div className={styles.articleWrap}>
          <article className={styles.article}>
            <div className={styles.ebookHeader}>
              <div className={styles.ebookCover}>
                {ebook.cover_image_url
                  ? <img src={ebook.cover_image_url} alt={ebook.title} />
                  : <div className={styles.ebookCoverPlaceholder}>{ebook.title?.[0]}</div>
                }
              </div>
              <h2 className={styles.ebookHeaderTitle}>{ebook.title}</h2>
              <p className={styles.ebookHeaderAuthor}>Penulis: {authorName || ebook.author}</p>
              <div className={styles.ebookDivider} />
            </div>
            <h1 className={styles.chapterTitle}>Bab {chapter.chapter_number}: {chapter.title}</h1>
            <div className={styles.chapterMeta}>Penulis: {authorName || ebook.author}</div>
            <div className={styles.chapterContent} dangerouslySetInnerHTML={{ __html: cleanContent(chapter.content) }} />
          </article>

          <nav className={styles.chapterNav}>
            {prevChapter
              ? <Link href={`/buku/${ebookSlug}/chapter/${prevChapter.id}`} className={styles.navBtn}>← Bab {prevChapter.chapter_number}</Link>
              : <span />}
            <Link href={`/buku/${ebookSlug}`} className={styles.navBtnOutline}>Daftar Bab</Link>
            {nextChapter
              ? <Link href={`/buku/${ebookSlug}/chapter/${nextChapter.id}`} className={styles.navBtn}>Bab {nextChapter.chapter_number} →</Link>
              : <span />}
          </nav>

          {/* Like & Rating */}
          <div className={styles.engageBox}>
            <button className={`${styles.likeBtn} ${liked ? styles.liked : ''}`} onClick={toggleLike}>
              <svg viewBox="0 0 20 20" fill={liked ? 'currentColor' : 'none'} width="20" height="20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              <span>{likeCount}</span>
            </button>
            <div className={styles.ratingBox}>
              <span className={styles.ratingLabel}>Rating: {rating > 0 ? rating : '—'}</span>
              <div className={styles.stars}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} className={`${styles.star} ${s <= userRating ? styles.starFilled : ''}`} onClick={() => submitRating(s)}>★</button>
                ))}
              </div>
            </div>
          </div>

          {/* Komentar */}
          <div className={styles.commentBox}>
            <h3 className={styles.commentTitle}>Komentar ({comments.length})</h3>
            <div className={styles.commentInput}>
              <textarea
                className={styles.commentTextarea}
                placeholder="Tulis komentar..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                rows={3}
              />
              <button className={styles.commentSubmit} onClick={submitComment} disabled={commentLoading}>
                {commentLoading ? 'Mengirim...' : 'Kirim'}
              </button>
            </div>
            <div className={styles.commentList}>
              {comments.map(c => (
                <div key={c.id} className={styles.commentItem}>
                  <div className={styles.commentAuthor}>{c.profiles?.full_name || c.profiles?.username || 'Anonim'}</div>
                  <div className={styles.commentContent}>{c.content}</div>
                  <div className={styles.commentDate}>{new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Related Ebooks */}
          {relatedEbooks.length > 0 && (
            <div className={styles.relatedBox}>
              <h3 className={styles.relatedTitle}>E-book Lainnya</h3>
              <div className={styles.relatedGrid}>
                {relatedEbooks.map(r => (
                  <Link key={r.id} href={`/buku/${r.slug || r.id}`} className={styles.relatedCard}>
                    <div className={styles.relatedCover}>
                      {r.cover_image_url
                        ? <img src={r.cover_image_url} alt={r.title} />
                        : <div className={styles.relatedCoverPlaceholder}>{r.title?.[0]}</div>
                      }
                    </div>
                    <div className={styles.relatedInfo}>
                      <div className={styles.relatedCardTitle}>{r.title}</div>
                      <div className={styles.relatedCardAuthor}>{r.author}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          </div>

          {/* Floating Panel Desktop */}
          <div className={styles.floatPanel}>
            {bookmarkMsg && <div className={styles.bookmarkMsg}>{bookmarkMsg}</div>}

            <button className={styles.floatItem} onClick={() => { setDrawerOpen(o => !o); setShareOpen(false) }} title="Daftar Bab">
              <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
                <path d="M3 5h14M3 10h14M3 15h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>

            <button className={styles.floatItem} onClick={toggleDark} title={darkMode ? 'Mode Terang' : 'Mode Gelap'}>
              {darkMode ? (
                <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
                  <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              )}
            </button>

            <button className={`${styles.floatItem} ${bookmarked ? styles.floatActive : ''}`} onClick={toggleBookmark} title={bookmarked ? 'Hapus Simpanan' : 'Simpan Halaman'}>
              <svg viewBox="0 0 20 20" fill={bookmarked ? 'currentColor' : 'none'} width="18" height="18">
                <path d="M5 3h10a1 1 0 011 1v13l-6-3-6 3V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <button className={styles.floatItem} onClick={() => { setShareOpen(o => !o); setDrawerOpen(false) }} title="Bagikan">
              <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
                <circle cx="15" cy="4" r="2" stroke="currentColor" strokeWidth="1.8"/>
                <circle cx="5" cy="10" r="2" stroke="currentColor" strokeWidth="1.8"/>
                <circle cx="15" cy="16" r="2" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M7 9l6-4M7 11l6 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>

            {shareOpen && (
              <div className={styles.sharePopup}>
                {shareLinks.map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    className={styles.shareBtn} style={{ '--share-color': s.color }}
                    title={s.label}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            )}

            {drawerOpen && (
              <div className={styles.tocPopup}>
                <div className={styles.drawerHeader}>
                  <span>Daftar Bab</span>
                  <button className={styles.drawerClose} onClick={() => setDrawerOpen(false)}>✕</button>
                </div>
                <div className={styles.drawerList}>
                  {allChapters.map(c => (
                    <Link
                      key={c.id}
                      href={`/buku/${ebookSlug}/chapter/${c.id}`}
                      className={`${styles.drawerItem} ${c.id === params.chapterId ? styles.drawerActive : ''}`}
                      onClick={() => setDrawerOpen(false)}
                    >
                      <span className={styles.sidebarNum}>Bab {c.chapter_number}</span>
                      <span className={styles.sidebarChTitle}>{c.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Floating Panel Mobile */}
      <div className={styles.floatPanelMobile}>
        {bookmarkMsg && <div className={styles.bookmarkMsgMobile}>{bookmarkMsg}</div>}
        <button className={styles.floatItemMobile} onClick={() => { setDrawerOpen(o => !o); setShareOpen(false) }} title="Daftar Bab">
          <svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M3 5h14M3 10h14M3 15h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </button>
        <button className={styles.floatItemMobile} onClick={toggleDark} title={darkMode ? 'Mode Terang' : 'Mode Gelap'}>
          {darkMode
            ? <svg viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            : <svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          }
        </button>
        <button className={`${styles.floatItemMobile} ${bookmarked ? styles.floatActive : ''}`} onClick={toggleBookmark} title={bookmarked ? 'Hapus Simpanan' : 'Simpan Halaman'}>
          <svg viewBox="0 0 20 20" fill={bookmarked ? 'currentColor' : 'none'} width="18" height="18"><path d="M5 3h10a1 1 0 011 1v13l-6-3-6 3V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button className={styles.floatItemMobile} onClick={() => { setShareOpen(o => !o); setDrawerOpen(false) }} title="Bagikan">
          <svg viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="15" cy="4" r="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="5" cy="10" r="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="15" cy="16" r="2" stroke="currentColor" strokeWidth="1.8"/><path d="M7 9l6-4M7 11l6 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </button>
      </div>

      {/* TOC Overlay Mobile */}
      {drawerOpen && (
        <div className={styles.mobileOverlay} onClick={() => setDrawerOpen(false)}>
          <div className={styles.mobileToc} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <span>Daftar Bab</span>
              <button className={styles.drawerClose} onClick={() => setDrawerOpen(false)}>✕</button>
            </div>
            <div className={styles.drawerList}>
              {allChapters.map(c => (
                <Link key={c.id} href={`/buku/${ebookSlug}/chapter/${c.id}`}
                  className={`${styles.drawerItem} ${c.id === params.chapterId ? styles.drawerActive : ''}`}
                  onClick={() => setDrawerOpen(false)}
                >
                  <span className={styles.sidebarNum}>Bab {c.chapter_number}</span>
                  <span className={styles.sidebarChTitle}>{c.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Share Overlay Mobile */}
      {shareOpen && (
        <div className={styles.mobileOverlay} onClick={() => setShareOpen(false)}>
          <div className={styles.mobileShare} onClick={e => e.stopPropagation()}>
            {shareLinks.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                className={styles.shareBtn} title={s.label}>
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

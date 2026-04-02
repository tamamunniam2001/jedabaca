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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [fontSize, setFontSize] = useState('md') // sm | md | lg
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkMsg, setBookmarkMsg] = useState('')
  const [relatedEbooks, setRelatedEbooks] = useState([])
  const [authorName, setAuthorName] = useState('')

  // Rating
  const [avgRating, setAvgRating] = useState(0)
  const [ratingCount, setRatingCount] = useState(0)
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [ratingLoading, setRatingLoading] = useState(false)

  // Comments
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [replyTo, setReplyTo] = useState(null) // { id, authorName }
  const [replyText, setReplyText] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [likedComments, setLikedComments] = useState({}) // { commentId: true/false }
  const [commentLikes, setCommentLikes] = useState({}) // { commentId: count }

  useEffect(() => {
    const saved = localStorage.getItem('readerDark')
    if (saved === 'true') setDarkMode(true)
    const savedFont = localStorage.getItem('readerFont')
    if (savedFont) setFontSize(savedFont)
  }, [])

  const toggleDark = () => {
    setDarkMode(d => { localStorage.setItem('readerDark', String(!d)); return !d })
  }

  const cycleFontSize = () => {
    setFontSize(prev => {
      const next = prev === 'sm' ? 'md' : prev === 'md' ? 'lg' : 'sm'
      localStorage.setItem('readerFont', next)
      return next
    })
  }

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }
    checkUser()
  }, [])

  const fetchRatings = async (chapterId) => {
    const { data } = await supabase
      .from('chapter_ratings').select('user_id, rating')
      .eq('chapter_id', chapterId)
    if (!data?.length) return
    const avg = data.reduce((s, r) => s + r.rating, 0) / data.length
    setAvgRating(Math.round(avg * 10) / 10)
    setRatingCount(data.length)
  }

  const fetchComments = async (chapterId, currentUserId) => {
    const { data } = await supabase
      .from('chapter_comments')
      .select('id, user_id, content, created_at, parent_id')
      .eq('chapter_id', chapterId).order('created_at', { ascending: true })
    if (!data?.length) { setComments([]); return }

    const userIds = [...new Set(data.map(c => c.user_id))]
    const { data: profiles } = await supabase
      .from('profiles').select('id, full_name, username').in('id', userIds)
    const profileMap = {}
    profiles?.forEach(p => { profileMap[p.id] = p.full_name || p.username || 'Pembaca' })

    // Fetch likes
    const commentIds = data.map(c => c.id)
    const { data: likesData } = await supabase
      .from('comment_likes').select('comment_id, user_id').in('comment_id', commentIds)

    const likeCounts = {}
    const userLiked = {}
    likesData?.forEach(l => {
      likeCounts[l.comment_id] = (likeCounts[l.comment_id] || 0) + 1
      if (l.user_id === currentUserId) userLiked[l.comment_id] = true
    })

    setCommentLikes(likeCounts)
    setLikedComments(userLiked)
    setComments(data.map(c => ({ ...c, authorName: profileMap[c.user_id] || 'Pembaca' })))
  }

  useEffect(() => {
    const fetchChapter = async () => {
      try {
        const { data: chapterData, error } = await supabase
          .from('chapters').select('*').eq('id', params.chapterId).single()
        if (error) throw error
        setChapter(chapterData)

        const [{ data: ebookData }, { data: chaptersData }] = await Promise.all([
          supabase.from('novels').select('*').eq('id', chapterData.novel_id).single(),
          supabase.from('chapters').select('id, chapter_number, title')
            .eq('novel_id', chapterData.novel_id)
            .eq('publish_status', 'published')
            .order('chapter_number', { ascending: true }),
        ])
        setEbook(ebookData)
        setAllChapters(chaptersData || [])

        if (ebookData) {
          const [{ data: profileData }, { data: relatedData }] = await Promise.all([
            supabase.from('profiles').select('full_name, username').eq('id', ebookData.author_id).single(),
            supabase.from('novels').select('id, title, slug, cover_image_url, author')
              .neq('id', chapterData.novel_id).eq('publish_status', 'published').limit(4),
          ])
          setAuthorName(profileData?.full_name || profileData?.username || ebookData.author || '')
          setRelatedEbooks(relatedData || [])
        }

        await supabase.from('chapters')
          .update({ views: (chapterData.views || 0) + 1 }).eq('id', params.chapterId)

        await Promise.all([
          fetchRatings(params.chapterId),
          fetchComments(params.chapterId, user?.id),
        ])
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }
    if (params.chapterId) fetchChapter()
  }, [params.chapterId, user])

  // Load user's existing rating
  useEffect(() => {
    if (!user || !params.chapterId) return
    supabase.from('chapter_ratings')
      .select('rating').eq('chapter_id', params.chapterId).eq('user_id', user.id).maybeSingle()
      .then(({ data }) => { if (data) setUserRating(data.rating) })
    setBookmarked(localStorage.getItem(`bookmark_${user.id}_${params.chapterId}`) === 'true')
  }, [user, params.chapterId])

  const toggleCommentLike = async (commentId) => {
    if (!user) { router.push('/auth'); return }
    const isLiked = likedComments[commentId]
    // Optimistic update
    setLikedComments(prev => ({ ...prev, [commentId]: !isLiked }))
    setCommentLikes(prev => ({ ...prev, [commentId]: (prev[commentId] || 0) + (isLiked ? -1 : 1) }))
    if (isLiked) {
      await supabase.from('comment_likes').delete()
        .eq('comment_id', commentId).eq('user_id', user.id)
    } else {
      await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: user.id })
    }
  }

  const submitReply = async (parentId) => {
    if (!user) { router.push('/auth'); return }
    if (!replyText.trim() || replyLoading) return
    setReplyLoading(true)
    const { error } = await supabase.from('chapter_comments').insert({
      chapter_id: params.chapterId,
      user_id: user.id,
      content: replyText.trim(),
      parent_id: parentId,
    })
    if (!error) {
      setReplyText('')
      setReplyTo(null)
      await fetchComments(params.chapterId, user.id)
    }
    setReplyLoading(false)
  }

  const toggleBookmark = async () => {
    if (!user) { router.push('/auth'); return }
    if (!ebook) return
    const next = !bookmarked
    setBookmarked(next)
    localStorage.setItem(`bookmark_${user.id}_${params.chapterId}`, String(next))
    if (next) await supabase.from('bookmarks').upsert({ user_id: user.id, novel_id: ebook.id, chapter_id: params.chapterId })
    else await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('chapter_id', params.chapterId)
    setBookmarkMsg(next ? 'Disimpan!' : 'Dihapus')
    setTimeout(() => setBookmarkMsg(''), 2000)
  }

  const submitRating = async (val) => {
    if (!user) { router.push('/auth'); return }
    if (ratingLoading) return
    setRatingLoading(true)
    setUserRating(val)
    const { data: existing } = await supabase.from('chapter_ratings')
      .select('id').eq('chapter_id', params.chapterId).eq('user_id', user.id).maybeSingle()
    if (existing) {
      await supabase.from('chapter_ratings').update({ rating: val })
        .eq('chapter_id', params.chapterId).eq('user_id', user.id)
    } else {
      await supabase.from('chapter_ratings')
        .insert({ chapter_id: params.chapterId, user_id: user.id, rating: val })
    }
    await fetchRatings(params.chapterId)
    setRatingLoading(false)
  }

  const submitComment = async () => {
    if (!user) { router.push('/auth'); return }
    if (!commentText.trim() || commentLoading) return
    setCommentLoading(true)
    const { error } = await supabase.from('chapter_comments')
      .insert({ chapter_id: params.chapterId, user_id: user.id, content: commentText.trim(), parent_id: null })
    if (!error) {
      setCommentText('')
      await fetchComments(params.chapterId, user.id)
    }
    setCommentLoading(false)
  }

  // Separate top-level and replies
  const topComments = comments.filter(c => !c.parent_id)
  const getReplies = (parentId) => comments.filter(c => c.parent_id === parentId)

  const currentIndex = allChapters.findIndex(c => c.id === params.chapterId)
  const prevChapter = allChapters[currentIndex - 1]
  const nextChapter = allChapters[currentIndex + 1]
  const ebookSlug = ebook?.slug || params.slug
  const cleanContent = (html) => html?.replace(/(<br\s*\/?>){2,}/gi, '<br>') || ''
  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareText = ebook ? `Baca "${ebook.title}" di Jeda Baca` : ''
  const shareLinks = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + pageUrl)}` },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}` },
    { label: 'X', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}` },
    { label: 'Instagram', href: `https://www.instagram.com/jedabaca/` },
  ]

  if (loading) return <div className={styles.loadingWrap}><div className={styles.loading}>Memuat...</div></div>
  if (!chapter || !ebook) return <div className={styles.loadingWrap}><div className={styles.loading}>Bab tidak ditemukan</div></div>

  return (
    <main className={`${styles.main} ${darkMode ? styles.dark : ''} ${styles['font_' + fontSize]}`}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href={`/ebook/${ebookSlug}`} className={styles.backBtn}>← Kembali</Link>
          <div className={styles.headerMeta}>
            <span className={styles.ebookTitle}>{ebook.title}</span>
            <span className={styles.headerSep}>·</span>
            <span className={styles.chapterLabel}>{chapter.title}</span>
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
                    : <div className={styles.ebookCoverPlaceholder}>{ebook.title?.[0]}</div>}
                </div>
                <h2 className={styles.ebookHeaderTitle}>{ebook.title}</h2>
                <p className={styles.ebookHeaderAuthor}>Penulis: {authorName || ebook.author}</p>
                <div className={styles.ebookDivider} />
              </div>
              <h1 className={styles.chapterTitle}>{chapter.title}</h1>
              <div className={styles.chapterMeta}>Penulis: {authorName || ebook.author}</div>
              <div className={styles.chapterContent} dangerouslySetInnerHTML={{ __html: cleanContent(chapter.content) }} />
            </article>

            <nav className={styles.chapterNav}>
              {prevChapter
                ? <Link href={`/ebook/${ebookSlug}/chapter/${prevChapter.id}`} className={styles.navBtn}>← {prevChapter.title}</Link>
                : <span />}
              <Link href={`/ebook/${ebookSlug}`} className={styles.navBtnOutline}>Daftar Bab</Link>
              {nextChapter
                ? <Link href={`/ebook/${ebookSlug}/chapter/${nextChapter.id}`} className={styles.navBtn}>{nextChapter.title} →</Link>
                : <span />}
            </nav>

            {/* Rating Bab */}
            <div className={styles.ratingSection}>
              <div className={styles.ratingLeft}>
                <span className={styles.ratingAvg}>{avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
                <div className={styles.ratingStars}>
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} width="18" height="18" viewBox="0 0 24 24"
                      fill={s <= Math.round(avgRating) ? '#f5a623' : '#ddd'}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <span className={styles.ratingCountLabel}>{ratingCount} rating</span>
              </div>
              <div className={styles.ratingRight}>
                {user ? (
                  <>
                    <span className={styles.ratingPrompt}>Beri nilai bab ini:</span>
                    <div className={styles.starInput}>
                      {[1,2,3,4,5].map(s => (
                        <button key={s} type="button"
                          className={styles.starBtn}
                          disabled={ratingLoading}
                          onMouseEnter={() => setHoverRating(s)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => submitRating(s)}>
                          <svg width="24" height="24" viewBox="0 0 24 24"
                            fill={s <= (hoverRating || userRating) ? '#f5a623' : '#ddd'}>
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        </button>
                      ))}
                      {userRating > 0 && <span className={styles.userRatingLabel}>({userRating}/5)</span>}
                    </div>
                  </>
                ) : (
                  <Link href="/auth" className={styles.loginPromptSmall}>Login untuk memberi nilai</Link>
                )}
              </div>
            </div>

            {/* Komentar */}
            <div className={styles.commentBox}>
              <h3 className={styles.commentTitle}>Komentar ({comments.length})</h3>
              {user ? (
                <div className={styles.commentInput}>
                  <textarea
                    className={styles.commentTextarea}
                    placeholder="Tulis komentar..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    rows={3}
                  />
                  <button className={styles.commentSubmit} onClick={submitComment} disabled={commentLoading || !commentText.trim()}>
                    {commentLoading ? 'Mengirim...' : 'Kirim'}
                  </button>
                </div>
              ) : (
                <p className={styles.loginPromptSmall}>
                  <Link href="/auth">Login</Link> untuk menulis komentar.
                </p>
              )}
              <div className={styles.commentList}>
                {topComments.length === 0 && (
                  <p className={styles.noComments}>Belum ada komentar. Jadilah yang pertama!</p>
                )}
                {topComments.map(c => (
                  <div key={c.id} className={styles.commentItem}>
                    <div className={styles.commentHeader}>
                      <span className={styles.commentAuthor}>{c.authorName}</span>
                      <span className={styles.commentDate}>
                        {new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className={styles.commentContent}>{c.content}</div>
                    <div className={styles.commentActions}>
                      <button
                        className={`${styles.likeCommentBtn} ${likedComments[c.id] ? styles.likeCommentActive : ''}`}
                        onClick={() => toggleCommentLike(c.id)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24"
                          fill={likedComments[c.id] ? 'currentColor' : 'none'}
                          stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                        </svg>
                        {commentLikes[c.id] || 0}
                      </button>
                      <button
                        className={styles.replyBtn}
                        onClick={() => {
                          if (replyTo?.id === c.id) { setReplyTo(null); setReplyText('') }
                          else { setReplyTo({ id: c.id, authorName: c.authorName }); setReplyText('') }
                        }}
                      >
                        Balas
                      </button>
                    </div>

                    {/* Reply form */}
                    {replyTo?.id === c.id && (
                      <div className={styles.replyForm}>
                        <span className={styles.replyingTo}>Membalas {replyTo.authorName}</span>
                        <textarea
                          className={styles.replyTextarea}
                          placeholder={`Balas ${replyTo.authorName}...`}
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          rows={2}
                          autoFocus
                        />
                        <div className={styles.replyFormActions}>
                          <button className={styles.cancelReplyBtn} onClick={() => { setReplyTo(null); setReplyText('') }}>Batal</button>
                          <button className={styles.submitReplyBtn} onClick={() => submitReply(c.id)} disabled={replyLoading || !replyText.trim()}>
                            {replyLoading ? 'Mengirim...' : 'Kirim Balasan'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {getReplies(c.id).length > 0 && (
                      <div className={styles.repliesList}>
                        {getReplies(c.id).map(r => (
                          <div key={r.id} className={styles.replyItem}>
                            <div className={styles.commentHeader}>
                              <span className={styles.commentAuthor}>{r.authorName}</span>
                              <span className={styles.commentDate}>
                                {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            <div className={styles.commentContent}>{r.content}</div>
                            <div className={styles.commentActions}>
                              <button
                                className={`${styles.likeCommentBtn} ${likedComments[r.id] ? styles.likeCommentActive : ''}`}
                                onClick={() => toggleCommentLike(r.id)}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24"
                                  fill={likedComments[r.id] ? 'currentColor' : 'none'}
                                  stroke="currentColor" strokeWidth="2">
                                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                                </svg>
                                {commentLikes[r.id] || 0}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Related */}
            {relatedEbooks.length > 0 && (
              <div className={styles.relatedBox}>
                <h3 className={styles.relatedTitle}>E-book Lainnya</h3>
                <div className={styles.relatedGrid}>
                  {relatedEbooks.map(r => (
                    <Link key={r.id} href={`/ebook/${r.slug || r.id}`} className={styles.relatedCard}>
                      <div className={styles.relatedCover}>
                        {r.cover_image_url
                          ? <img src={r.cover_image_url} alt={r.title} />
                          : <div className={styles.relatedCoverPlaceholder}>{r.title?.[0]}</div>}
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
              <svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M3 5h14M3 10h14M3 15h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </button>
            <button className={styles.floatItem} onClick={cycleFontSize} title={`Ukuran font: ${fontSize === 'sm' ? 'Kecil' : fontSize === 'md' ? 'Sedang' : 'Besar'}`}>
              <span style={{ fontSize: fontSize === 'sm' ? '11px' : fontSize === 'md' ? '14px' : '17px', fontWeight: 800, fontFamily: 'Georgia, serif', lineHeight: 1 }}>A</span>
            </button>
            <button className={styles.floatItem} onClick={toggleDark} title={darkMode ? 'Mode Terang' : 'Mode Gelap'}>
              {darkMode
                ? <svg viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                : <svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
            </button>
            <button className={`${styles.floatItem} ${bookmarked ? styles.floatActive : ''}`} onClick={toggleBookmark} title="Simpan">
              <svg viewBox="0 0 20 20" fill={bookmarked ? 'currentColor' : 'none'} width="18" height="18"><path d="M5 3h10a1 1 0 011 1v13l-6-3-6 3V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button className={styles.floatItem} onClick={() => { setShareOpen(o => !o); setDrawerOpen(false) }} title="Bagikan">
              <svg viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="15" cy="4" r="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="5" cy="10" r="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="15" cy="16" r="2" stroke="currentColor" strokeWidth="1.8"/><path d="M7 9l6-4M7 11l6 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </button>

            {shareOpen && (
              <div className={styles.sharePopup}>
                {shareLinks.map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className={styles.shareBtn} title={s.label}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{s.label}</span>
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
                    <Link key={c.id} href={`/ebook/${ebookSlug}/chapter/${c.id}`}
                      className={`${styles.drawerItem} ${c.id === params.chapterId ? styles.drawerActive : ''}`}
                      onClick={() => setDrawerOpen(false)}>
                      <span className={styles.sidebarChTitle}>{c.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Floating Panel */}
      <div className={styles.floatPanelMobile}>
        {bookmarkMsg && <div className={styles.bookmarkMsgMobile}>{bookmarkMsg}</div>}
        <button className={styles.floatItemMobile} onClick={() => { setMobileDrawerOpen(o => !o); setShareOpen(false) }}>
          <svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M3 5h14M3 10h14M3 15h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </button>
        <button className={styles.floatItemMobile} onClick={cycleFontSize} title="Ukuran Font">
          <span style={{ fontSize: fontSize === 'sm' ? '11px' : fontSize === 'md' ? '14px' : '17px', fontWeight: 800, fontFamily: 'Georgia, serif', lineHeight: 1, color: 'inherit' }}>A</span>
        </button>
        <button className={styles.floatItemMobile} onClick={toggleDark}>
          {darkMode
            ? <svg viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            : <svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
        </button>
        <button className={`${styles.floatItemMobile} ${bookmarked ? styles.floatActive : ''}`} onClick={toggleBookmark}>
          <svg viewBox="0 0 20 20" fill={bookmarked ? 'currentColor' : 'none'} width="18" height="18"><path d="M5 3h10a1 1 0 011 1v13l-6-3-6 3V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button className={styles.floatItemMobile} onClick={() => { setShareOpen(o => !o); setDrawerOpen(false) }}>
          <svg viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="15" cy="4" r="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="5" cy="10" r="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="15" cy="16" r="2" stroke="currentColor" strokeWidth="1.8"/><path d="M7 9l6-4M7 11l6 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </button>
      </div>

      {mobileDrawerOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileDrawerOpen(false)}>
          <div className={styles.mobileToc} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <span>Daftar Bab</span>
              <button className={styles.drawerClose} onClick={() => setMobileDrawerOpen(false)}>✕</button>
            </div>
            <div className={styles.drawerList}>
              {allChapters.map(c => (
                <Link key={c.id} href={`/ebook/${ebookSlug}/chapter/${c.id}`}
                  className={`${styles.drawerItem} ${c.id === params.chapterId ? styles.drawerActive : ''}`}
                  onClick={() => setMobileDrawerOpen(false)}>
                  <span className={styles.sidebarChTitle}>{c.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {shareOpen && (
        <div className={styles.mobileOverlay} onClick={() => setShareOpen(false)}>
          <div className={styles.mobileShare} onClick={e => e.stopPropagation()}>
            {shareLinks.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className={styles.shareBtn} title={s.label}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{s.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

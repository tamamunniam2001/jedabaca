'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import styles from './page.module.css'

const RichEditor = dynamic(() => import('@/components/RichEditor'), {
  ssr: false,
  loading: () => <div style={{ height: 300, background: '#f8f7fc', borderRadius: 8, border: '1.5px solid #e8e4f0' }} />
})

const GENRES = ['Romance', 'Fantasy', 'Thriller', 'Horror', 'Drama', 'Komedi', 'Misteri', 'Sci-Fi', 'Slice of Life', 'Lainnya']

const STATUS_LABEL = {
  draft: { label: 'Draf', color: '#f59e0b' },
  published: { label: 'Diterbitkan', color: '#10b981' },
  rejected: { label: 'Ditolak', color: '#ef4444' },
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [novels, setNovels] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [coverPreview, setCoverPreview] = useState(null)
  const [coverFile, setCoverFile] = useState(null)

  const [form, setForm] = useState({
    title: '', genre: '', description: '', slug: '',
  })
  const [chapters, setChapters] = useState([
    { chapter_number: 1, title: '', content: '' }
  ])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }
      setUser(session.user)

      // Cek role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!profile || !['author', 'admin'].includes(profile.role)) {
        router.push('/?error=unauthorized')
        return
      }

      await fetchNovels(session.user.id)
      setLoading(false)
    }
    init()
  }, [router])

  const fetchNovels = async (userId) => {
    const { data } = await supabase
      .from('novels')
      .select('*, chapters(id)')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
    setNovels(data || [])
  }

  const handleCover = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const addChapter = () => {
    setChapters(prev => [...prev, {
      chapter_number: prev.length + 1,
      title: '',
      content: '',
    }])
  }

  const removeChapter = (idx) => {
    setChapters(prev => prev.filter((_, i) => i !== idx)
      .map((c, i) => ({ ...c, chapter_number: i + 1 })))
  }

  const updateChapter = (idx, field, val) => {
    setChapters(prev => prev.map((c, i) => i === idx ? { ...c, [field]: val } : c))
  }

  const generateSlug = (title) =>
    title.toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

  const handleSubmit = async (publishStatus) => {
    if (!form.title.trim()) { setMessage({ text: 'Judul buku wajib diisi.', type: 'error' }); return }
    if (chapters.some(c => !c.title.trim() || !c.content.trim())) {
      setMessage({ text: 'Semua bab harus memiliki judul dan isi.', type: 'error' }); return
    }

    setSubmitting(true)
    setMessage({ text: '', type: '' })

    try {
      // Upload cover
      let cover_image_url = null
      if (coverFile) {
        const ext = coverFile.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('covers')
          .upload(path, coverFile, { upsert: true })
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('covers').getPublicUrl(path)
          cover_image_url = urlData.publicUrl
        }
      }

      // Insert novel
      const { data: novel, error: novelErr } = await supabase
        .from('novels')
        .insert({
          title: form.title,
          genre: form.genre,
          description: form.description,
          cover_image_url,
          author_id: user.id,
          author: user.user_metadata?.full_name || user.email,
          publish_status: publishStatus,
          status: publishStatus === 'published' ? 'ongoing' : 'draft',
          slug: form.slug || generateSlug(form.title),
        })
        .select()
        .single()

      if (novelErr) throw novelErr

      // Insert chapters
      const { error: chapErr } = await supabase
        .from('chapters')
        .insert(chapters.map(c => ({
          novel_id: novel.id,
          chapter_number: c.chapter_number,
          title: c.title,
          content: c.content,
        })))

      if (chapErr) throw chapErr

      setMessage({
        text: publishStatus === 'published' ? 'E-book berhasil diterbitkan!' : 'E-book disimpan sebagai draf.',
        type: 'success'
      })
      setForm({ title: '', genre: '', description: '', slug: '' })
      setChapters([{ chapter_number: 1, title: '', content: '' }])
      setCoverFile(null)
      setCoverPreview(null)
      await fetchNovels(user.id)
    } catch (err) {
      setMessage({ text: 'Gagal menyimpan: ' + err.message, type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className={styles.loading}>Memuat dasbor...</div>

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>Dasbor Penulis</h1>
          <p className={styles.subtitle}>Kelola dan terbitkan karya Anda</p>
        </div>

        {/* Upload Form */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📝 Unggah E-book Baru</h2>

          {message.text && (
            <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>
          )}

          <div className={styles.formGrid}>
            {/* Left: Info Novel */}
            <div className={styles.formLeft}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Judul Buku *</label>
                <input
                  className={styles.input}
                  value={form.title}
                  onChange={e => {
                    const title = e.target.value
                    setForm(p => ({
                      ...p,
                      title,
                      slug: p.slug || generateSlug(title),
                    }))
                  }}
                  placeholder="Masukkan judul e-book"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>URL Kustom (Slug)</label>
                <div className={styles.slugWrapper}>
                  <span className={styles.slugPrefix}>/buku/</span>
                  <input
                    className={styles.slugInput}
                    value={form.slug}
                    onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-') }))}
                    placeholder="judul-buku-anda"
                  />
                </div>
                <p className={styles.slugHint}>Otomatis dari judul. Hanya huruf kecil, angka, dan tanda hubung.</p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Genre</label>
                <select
                  className={styles.input}
                  value={form.genre}
                  onChange={e => setForm(p => ({ ...p, genre: e.target.value }))}
                >
                  <option value="">Pilih genre...</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Deskripsi Singkat</label>
                <textarea
                  className={styles.textarea}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Ceritakan sinopsis e-book Anda..."
                  rows={5}
                />
              </div>
            </div>

            {/* Right: Cover Upload */}
            <div className={styles.formRight}>
              <label className={styles.label}>Sampul Buku</label>
              <label className={styles.coverUpload}>
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover preview" className={styles.coverPreview} />
                ) : (
                  <div className={styles.coverPlaceholder}>
                    <span className={styles.coverIcon}>🖼️</span>
                    <span>Klik untuk unggah sampul</span>
                    <span className={styles.coverHint}>JPG, PNG, WebP (maks. 2MB)</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className={styles.fileInput}
                  onChange={handleCover}
                />
              </label>
              {coverPreview && (
                <button
                  type="button"
                  className={styles.removeCover}
                  onClick={() => { setCoverPreview(null); setCoverFile(null) }}
                >
                  Hapus Sampul
                </button>
              )}
            </div>
          </div>

          {/* Chapters */}
          <div className={styles.chaptersSection}>
            <div className={styles.chaptersHeader}>
              <h3 className={styles.chaptersTitle}>Bab-bab E-book</h3>
              <button type="button" className={styles.addChapterBtn} onClick={addChapter}>
                + Tambah Bab
              </button>
            </div>

            {chapters.map((chapter, idx) => (
              <div key={idx} className={styles.chapterCard}>
                <div className={styles.chapterHeader}>
                  <span className={styles.chapterNum}>Bab {chapter.chapter_number}</span>
                  {chapters.length > 1 && (
                    <button
                      type="button"
                      className={styles.removeChapterBtn}
                      onClick={() => removeChapter(idx)}
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Judul Bab *</label>
                  <input
                    className={styles.input}
                    value={chapter.title}
                    onChange={e => updateChapter(idx, 'title', e.target.value)}
                    placeholder={`Judul bab ${chapter.chapter_number}`}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Isi Bab *</label>
                  <RichEditor
                    value={chapter.content}
                    onChange={val => updateChapter(idx, 'content', val)}
                    placeholder={`Tulis isi bab ${chapter.chapter_number} di sini...`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className={styles.formActions}>
            <button
              className={styles.draftBtn}
              onClick={() => handleSubmit('draft')}
              disabled={submitting}
            >
              {submitting ? 'Menyimpan...' : '💾 Simpan Draf'}
            </button>
            <button
              className={styles.publishBtn}
              onClick={() => handleSubmit('published')}
              disabled={submitting}
            >
              {submitting ? 'Menerbitkan...' : '🚀 Terbitkan'}
            </button>
          </div>
        </section>

        {/* Novel List */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📚 E-book Saya ({novels.length})</h2>

          {novels.length === 0 ? (
            <p className={styles.empty}>Belum ada e-book. Mulai unggah karya pertama Anda!</p>
          ) : (
            <div className={styles.novelList}>
              {novels.map(novel => {
                const status = STATUS_LABEL[novel.publish_status] || STATUS_LABEL.draft
                const chapCount = novel.chapters?.length || 0
                return (
                  <div key={novel.id} className={styles.novelRow}>
                    <div className={styles.novelCover}>
                      {novel.cover_image_url ? (
                        <img src={novel.cover_image_url} alt={novel.title} />
                      ) : (
                        <span>📖</span>
                      )}
                    </div>
                    <div className={styles.novelInfo}>
                      <h4 className={styles.novelTitle}>{novel.title}</h4>
                      <p className={styles.novelMeta}>{novel.genre || 'Tanpa genre'} · {chapCount} bab</p>
                      <p className={styles.novelDate}>
                        {new Date(novel.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className={styles.novelRight}>
                      <span className={styles.statusBadge} style={{ background: status.color + '20', color: status.color }}>
                        {status.label}
                      </span>
                      <Link href={`/dashboard/buku/${novel.id}`} className={styles.manageBtn}>
                        Kelola →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

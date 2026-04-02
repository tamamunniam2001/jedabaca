'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import RichEditor from '@/components/RichEditor'
import ChapterPreview from '@/components/ChapterPreview'
import styles from './page.module.css'

const GENRES = ['Romance', 'Fantasy', 'Thriller', 'Horror', 'Drama', 'Komedi', 'Misteri', 'Sci-Fi', 'Slice of Life', 'Lainnya']

const STATUS_LABEL = {
  draft: { label: 'Draf', color: '#f59e0b' },
  published: { label: 'Diterbitkan', color: '#10b981' },
  rejected: { label: 'Ditolak', color: '#ef4444' },
}

export default function ManageNovelPage() {
  const router = useRouter()
  const { id } = useParams()

  const [user, setUser] = useState(null)
  const [novel, setNovel] = useState(null)
  const [chapters, setChapters] = useState([])
  const [activeTab, setActiveTab] = useState('info')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  // Info form
  const [form, setForm] = useState({ title: '', genre: '', description: '' })
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)

  // Chapter being edited
  const [editingChapter, setEditingChapter] = useState(null)
  const [newChapter, setNewChapter] = useState(null)
  const [previewChapter, setPreviewChapter] = useState(null)

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
        router.push('/dashboard?error=unauthorized')
        return
      }

      const { data: novelData, error } = await supabase
        .from('novels')
        .select('*')
        .eq('id', id)
        .eq('author_id', session.user.id)
        .single()

      if (error || !novelData) { router.push('/dashboard'); return }

      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('*')
        .eq('novel_id', id)
        .order('chapter_number', { ascending: true })

      setNovel(novelData)
      setForm({ title: novelData.title, genre: novelData.genre || '', description: novelData.description || '' })
      setCoverPreview(novelData.cover_image_url || null)
      setChapters(chaptersData || [])
      setLoading(false)
    }
    init()
  }, [id, router])

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  // Compress image before upload
  const compressImage = (file, maxWidth = 600, quality = 0.82) =>
    new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * ratio)
        canvas.height = Math.round(img.height * ratio)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(url)
        canvas.toBlob(resolve, 'image/jpeg', quality)
      }
      img.src = url
    })

  // Save novel info
  const saveInfo = async () => {
    setSaving(true)
    try {
      let cover_image_url = novel.cover_image_url
      if (coverFile) {
        const ext = coverFile.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('covers').upload(path, coverFile, { upsert: true })
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('covers').getPublicUrl(path)
          cover_image_url = urlData.publicUrl
        }
      }
      const { error } = await supabase.from('novels').update({
        title: form.title,
        genre: form.genre,
        description: form.description,
        cover_image_url,
        updated_at: new Date().toISOString(),
      }).eq('id', id)
      if (error) throw error
      setNovel(prev => ({ ...prev, ...form, cover_image_url }))
      setCoverFile(null)
      showMsg('Info novel berhasil disimpan!')
    } catch (e) {
      showMsg('Gagal: ' + e.message, 'error')
    }
    setSaving(false)
  }

  // Change publish status
  const changeStatus = async (status) => {
    setSaving(true)
    const { error } = await supabase.from('novels').update({
      publish_status: status,
      status: status === 'published' ? 'ongoing' : 'draft',
    }).eq('id', id)
    if (!error) {
      setNovel(prev => ({ ...prev, publish_status: status }))
      showMsg(status === 'published' ? 'Novel diterbitkan!' : 'Novel disimpan sebagai draf.')
    } else {
      showMsg('Gagal: ' + error.message, 'error')
    }
    setSaving(false)
  }

  // Save edited chapter
  const saveChapter = async (status = 'published') => {
    if (!editingChapter.title.trim() || !editingChapter.content.trim()) {
      showMsg('Judul dan isi bab wajib diisi.', 'error'); return
    }
    setSaving(true)
    const { error } = await supabase.from('chapters').update({
      title: editingChapter.title,
      content: editingChapter.content,
      publish_status: status,
      updated_at: new Date().toISOString(),
    }).eq('id', editingChapter.id)
    if (!error) {
      setChapters(prev => prev.map(c => c.id === editingChapter.id ? { ...c, ...editingChapter, publish_status: status } : c))
      setEditingChapter(null)
      showMsg(status === 'published' ? 'Bab diterbitkan!' : 'Bab disimpan sebagai draf.')
    } else {
      showMsg('Gagal: ' + error.message, 'error')
    }
    setSaving(false)
  }

  // Add new chapter
  const addChapter = async (status = 'published') => {
    if (!newChapter?.title?.trim() || !newChapter?.content?.trim()) {
      showMsg('Judul dan isi bab wajib diisi.', 'error'); return
    }
    setSaving(true)
    // Ambil chapter_number terbesar dari DB untuk hindari duplicate
    const { data: last } = await supabase
      .from('chapters').select('chapter_number')
      .eq('novel_id', id)
      .order('chapter_number', { ascending: false })
      .limit(1).single()
    const nextNum = (last?.chapter_number || 0) + 1
    const { data, error } = await supabase.from('chapters').insert({
      novel_id: id,
      chapter_number: nextNum,
      title: newChapter.title,
      content: newChapter.content,
      publish_status: status,
    }).select().single()
    if (!error) {
      setChapters(prev => [...prev, data])
      setNewChapter(null)
      showMsg(status === 'published' ? 'Bab diterbitkan!' : 'Bab disimpan sebagai draf.')
    } else {
      showMsg('Gagal: ' + error.message, 'error')
    }
    setSaving(false)
  }

  // Move chapter up/down
  const moveChapter = async (index, direction) => {
    const swapIndex = index + direction
    if (swapIndex < 0 || swapIndex >= chapters.length) return
    const a = chapters[index]
    const b = chapters[swapIndex]
    // Pakai nilai temp negatif untuk hindari unique constraint conflict
    const tmp = -(a.chapter_number)
    const r0 = await supabase.from('chapters').update({ chapter_number: tmp }).eq('id', a.id)
    if (r0.error) { showMsg('Gagal: ' + r0.error.message, 'error'); return }
    const r1 = await supabase.from('chapters').update({ chapter_number: a.chapter_number }).eq('id', b.id)
    if (r1.error) { showMsg('Gagal: ' + r1.error.message, 'error'); return }
    const r2 = await supabase.from('chapters').update({ chapter_number: b.chapter_number }).eq('id', a.id)
    if (r2.error) { showMsg('Gagal: ' + r2.error.message, 'error'); return }
    const updated = [...chapters]
    updated[index] = { ...a, chapter_number: b.chapter_number }
    updated[swapIndex] = { ...b, chapter_number: a.chapter_number }
    updated.sort((x, y) => x.chapter_number - y.chapter_number)
    setChapters(updated)
  }

  // Delete chapter
  const deleteChapter = async (chapterId) => {
    if (!confirm('Hapus bab ini?')) return
    const { error } = await supabase.from('chapters').delete().eq('id', chapterId)
    if (!error) {
      const remaining = chapters.filter(c => c.id !== chapterId)
      // Re-number secara sequential (bukan paralel) untuk hindari duplicate key
      for (let i = 0; i < remaining.length; i++) {
        await supabase.from('chapters').update({ chapter_number: i + 1 }).eq('id', remaining[i].id)
        remaining[i] = { ...remaining[i], chapter_number: i + 1 }
      }
      setChapters([...remaining])
      showMsg('Bab dihapus.')
    } else {
      showMsg('Gagal menghapus: ' + error.message, 'error')
    }
  }

  if (loading) return <div className={styles.loading}>Memuat...</div>

  const status = STATUS_LABEL[novel.publish_status] || STATUS_LABEL.draft

  return (
    <main className={styles.main}>
      <div className={styles.container}>

        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link href="/dashboard" className={styles.breadLink}>← Dasbor</Link>
          <span className={styles.breadSep}>/</span>
          <span className={styles.breadCurrent}>{novel.title}</span>
        </div>

        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>{novel.title}</h1>
            <span className={styles.statusBadge} style={{ background: status.color + '20', color: status.color }}>
              {status.label}
            </span>
          </div>
          <div className={styles.headerActions}>
            {novel.publish_status !== 'published' && (
              <button className={styles.publishBtn} onClick={() => changeStatus('published')} disabled={saving}>
                🚀 Terbitkan
              </button>
            )}
            {novel.publish_status === 'published' && (
              <button className={styles.draftBtn} onClick={() => changeStatus('draft')} disabled={saving}>
                📦 Jadikan Draf
              </button>
            )}
            <Link href={`/ebook/${id}`} className={styles.previewBtn} target="_blank">
              Pratinjau
            </Link>
          </div>
        </div>

        {message.text && (
          <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>
        )}

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'info' ? styles.active : ''}`} onClick={() => setActiveTab('info')}>
            📋 Info Novel
          </button>
          <button className={`${styles.tab} ${activeTab === 'chapters' ? styles.active : ''}`} onClick={() => setActiveTab('chapters')}>
            📖 Bab ({chapters.length})
          </button>
        </div>

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className={styles.section}>
            <div className={styles.formGrid}>
              <div className={styles.formLeft}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Judul Buku *</label>
                  <input className={styles.input} value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Genre</label>
                  <select className={styles.input} value={form.genre}
                    onChange={e => setForm(p => ({ ...p, genre: e.target.value }))}>
                    <option value="">Pilih genre...</option>
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Deskripsi</label>
                  <textarea className={styles.textarea} rows={5} value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <button className={styles.saveInfoBtn} onClick={saveInfo} disabled={saving}>
                  {saving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
                </button>
              </div>

              <div className={styles.formRight}>
                <label className={styles.label}>Sampul Buku</label>
                <label className={styles.coverUpload}>
                  {coverPreview ? (
                    <img src={coverPreview} alt="Cover" className={styles.coverPreview} />
                  ) : (
                    <div className={styles.coverPlaceholder}>
                      <span>🖼️</span>
                      <span>Klik untuk unggah</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className={styles.fileInput}
                    onChange={e => {
                      const f = e.target.files[0]
                      if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)) }
                    }} />
                </label>
                {coverFile && <p className={styles.coverHint}>Klik "Simpan Perubahan" untuk mengunggah.</p>}
              </div>
            </div>
          </div>
        )}

        {/* Chapters Tab */}
        {activeTab === 'chapters' && (
          <div className={styles.section}>
            {/* Chapter List */}
            {chapters.length === 0 && !newChapter && (
              <p className={styles.empty}>Belum ada bab. Tambahkan bab pertama!</p>
            )}

            {chapters.map((chapter, index) => (
              <div key={chapter.id} className={styles.chapterRow}>
                {editingChapter?.id === chapter.id ? (
                  // Edit mode
                  <div className={styles.chapterEditForm}>
                    <div className={styles.chapterEditHeader}>
                      <span className={styles.chapterNum}>#{chapter.chapter_number}</span>
                      <div className={styles.chapterEditHeaderRight}>
                        <button className={styles.previewInlineBtn} onClick={() => setPreviewChapter({ ...editingChapter })}>👁 Pratinjau</button>
                        <button className={styles.cancelSmallBtn} onClick={() => setEditingChapter(null)}>Batal</button>
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Judul Bab</label>
                      <input className={styles.input} value={editingChapter.title}
                        onChange={e => setEditingChapter(p => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Isi Bab</label>
                      <RichEditor value={editingChapter.content}
                        onChange={val => setEditingChapter(p => ({ ...p, content: val }))} />
                    </div>
                    <div className={styles.chapterSaveRow}>
                      <button className={styles.saveDraftBtn} onClick={() => saveChapter('draft')} disabled={saving}>
                        📦 Simpan Draf
                      </button>
                      <button className={styles.saveChapterBtn} onClick={() => saveChapter('published')} disabled={saving}>
                        {saving ? 'Menyimpan...' : '🚀 Terbitkan Bab'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className={styles.chapterViewRow}>
                    <div className={styles.chapterInfo}>
                      <span className={styles.chapterNum}>#{chapter.chapter_number}</span>
                      <span className={styles.chapterTitle}>{chapter.title}</span>
                      <span className={styles.chapterStatusBadge} style={{
                        background: chapter.publish_status === 'published' ? '#d1fae5' : '#fef3c7',
                        color: chapter.publish_status === 'published' ? '#065f46' : '#92400e'
                      }}>
                        {chapter.publish_status === 'published' ? 'Terbit' : 'Draf'}
                      </span>
                    </div>
                    <div className={styles.chapterActions}>
                      <div className={styles.moveButtons}>
                        <button className={styles.moveBtn} onClick={() => moveChapter(index, -1)} disabled={index === 0} title="Naik">▲</button>
                        <button className={styles.moveBtn} onClick={() => moveChapter(index, 1)} disabled={index === chapters.length - 1} title="Turun">▼</button>
                      </div>
                      <button className={styles.editChapterBtn}
                        onClick={() => { setEditingChapter({ ...chapter }); setNewChapter(null) }}>
                        ✏️ Edit
                      </button>
                      <button className={styles.previewChapterBtn}
                        onClick={() => setPreviewChapter({ ...chapter })}>
                        👁
                      </button>
                      <button className={styles.deleteChapterBtn} onClick={() => deleteChapter(chapter.id)}>
                        🗑
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* New Chapter Form */}
            {newChapter ? (
              <div className={styles.chapterEditForm}>
                <div className={styles.chapterEditHeader}>
                  <span className={styles.chapterNum}>(Baru)</span>
                  <div className={styles.chapterEditHeaderRight}>
                    <button className={styles.previewInlineBtn} onClick={() => setPreviewChapter({ ...newChapter, chapter_number: '?' })}>👁 Pratinjau</button>
                    <button className={styles.cancelSmallBtn} onClick={() => setNewChapter(null)}>Batal</button>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Judul Bab *</label>
                  <input className={styles.input} value={newChapter.title}
                    onChange={e => setNewChapter(p => ({ ...p, title: e.target.value }))}
                    placeholder="Judul bab baru" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Isi Bab *</label>
                  <RichEditor value={newChapter.content}
                    onChange={val => setNewChapter(p => ({ ...p, content: val }))} />
                </div>
                <div className={styles.chapterSaveRow}>
                  <button className={styles.saveDraftBtn} onClick={() => addChapter('draft')} disabled={saving}>
                    📦 Simpan Draf
                  </button>
                  <button className={styles.saveChapterBtn} onClick={() => addChapter('published')} disabled={saving}>
                    {saving ? 'Menyimpan...' : '🚀 Terbitkan Bab'}
                  </button>
                </div>
              </div>
            ) : (
              <button className={styles.addChapterBtn}
                onClick={() => { setNewChapter({ title: '', content: '' }); setEditingChapter(null) }}>
                + Tambah Bab Baru
              </button>
            )}
          </div>
        )}
      </div>

      {previewChapter && (
        <ChapterPreview
          novel={novel}
          chapter={previewChapter}
          onClose={() => setPreviewChapter(null)}
        />
      )}
    </main>
  )
}

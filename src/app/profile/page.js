'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import NovelCard from '@/components/NovelCard'
import styles from './page.module.css'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [novels, setNovels] = useState([])
  const [bookmarks, setBookmarks] = useState([])
  const [activeTab, setActiveTab] = useState('info')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: '', username: '', bio: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }

      setUser(session.user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setForm({
          full_name: profileData.full_name || '',
          username: profileData.username || '',
          bio: profileData.bio || '',
        })

        const { data: novelsData } = await supabase
          .from('novels')
          .select('*')
          .eq('author_id', session.user.id)
          .order('created_at', { ascending: false })

        setNovels(novelsData || [])

        const { data: bookmarksData } = await supabase
          .from('bookmarks')
          .select('id, created_at, novel_id, novels(id, title, slug, cover_image_url, author, genre)')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
        setBookmarks(bookmarksData || [])
      }

      setLoading(false)
    }
    init()
  }, [router])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        username: form.username,
        bio: form.bio,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      setMessage('Gagal menyimpan: ' + error.message)
    } else {
      setProfile(prev => ({ ...prev, ...form }))
      setEditing(false)
      setMessage('Profil berhasil disimpan!')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <div className={styles.loading}>Memuat profil...</div>

  return (
    <main className={styles.main}>
      {/* Header */}
      <section className={styles.headerSection}>
        <div className={styles.container}>
          <div className={styles.headerContent}>
            <div className={styles.avatarWrap}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className={styles.avatar} />
              ) : (
                <div className={styles.avatarPlaceholder}></div>
              )}
            </div>
            <div className={styles.headerInfo}>
              <h1 className={styles.name}>{profile?.full_name || profile?.username || user?.email}</h1>
              <p className={styles.email}>{user?.email}</p>
              <p className={styles.bio}>{profile?.bio || 'Belum ada bio.'}</p>
              <div className={styles.headerActions}>
                <button className={styles.editBtn} onClick={() => { setEditing(true); setActiveTab('info') }}>
                  Edit Profil
                </button>
                <button className={styles.logoutBtn} onClick={handleLogout}>
                  Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className={styles.tabsSection}>
        <div className={styles.container}>
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${activeTab === 'info' ? styles.active : ''}`} onClick={() => setActiveTab('info')}>
              Info Saya
            </button>
            <button className={`${styles.tab} ${activeTab === 'books' ? styles.active : ''}`} onClick={() => setActiveTab('books')}>
              Buku Saya ({novels.length})
            </button>
            <button className={`${styles.tab} ${activeTab === 'bookmarks' ? styles.active : ''}`} onClick={() => setActiveTab('bookmarks')}>
              Koleksi ({bookmarks.length})
            </button>
          </div>

          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className={styles.tabContent}>
              {message && (
                <div className={`${styles.message} ${message.includes('Gagal') ? styles.error : styles.success}`}>
                  {message}
                </div>
              )}
              {editing ? (
                <div className={styles.editForm}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nama Lengkap</label>
                    <input
                      className={styles.input}
                      value={form.full_name}
                      onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                      placeholder="Nama lengkap"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Username</label>
                    <input
                      className={styles.input}
                      value={form.username}
                      onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                      placeholder="Username"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Bio</label>
                    <textarea
                      className={styles.textarea}
                      value={form.bio}
                      onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                      placeholder="Ceritakan sedikit tentang diri Anda..."
                      rows={4}
                    />
                  </div>
                  <div className={styles.formActions}>
                    <button className={styles.cancelBtn} onClick={() => setEditing(false)} disabled={saving}>Batal</button>
                    <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                      {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.infoCard}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Nama Lengkap</span>
                    <span className={styles.infoValue}>{profile?.full_name || '-'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Username</span>
                    <span className={styles.infoValue}>{profile?.username || '-'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Email</span>
                    <span className={styles.infoValue}>{user?.email}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Bio</span>
                    <span className={styles.infoValue}>{profile?.bio || '-'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Bergabung</span>
                    <span className={styles.infoValue}>
                      {new Date(user?.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Role</span>
                    <span className={styles.infoValue}>
                      <span className={`${styles.roleBadge} ${styles['role_' + (profile?.role || 'reader')]}`}>
                        {profile?.role === 'author' ? 'Penulis' : profile?.role === 'admin' ? 'Admin' : 'Pembaca'}
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Books Tab */}
          {activeTab === 'books' && (
            <div className={styles.tabContent}>
              {novels.length === 0 ? (
                <p className={styles.empty}>Anda belum menerbitkan buku.</p>
              ) : (
                <div className={styles.booksGrid}>
                  {novels.map(novel => <NovelCard key={novel.id} novel={novel} />)}
                </div>
              )}
            </div>
          )}

          {/* Bookmarks Tab */}
          {activeTab === 'bookmarks' && (
            <div className={styles.tabContent}>
              {bookmarks.length === 0 ? (
                <p className={styles.empty}>Belum ada koleksi tersimpan.</p>
              ) : (
                <div className={styles.bookmarkList}>
                  {bookmarks.map(bm => {
                    const novel = bm.novels
                    const slug = novel?.slug || novel?.id
                    return (
                      <div key={bm.id} className={styles.bookmarkItem}>
                        <div className={styles.bookmarkCover}>
                          {novel?.cover_image_url
                            ? <img src={novel.cover_image_url} alt={novel.title} />
                            : <div className={styles.bookmarkCoverPlaceholder}>{novel?.title?.[0]}</div>
                          }
                        </div>
                        <div className={styles.bookmarkInfo}>
                          <p className={styles.bookmarkNovel}>{novel?.title}</p>
                          <p className={styles.bookmarkMeta}>{novel?.genre} · {novel?.author}</p>
                          <p className={styles.bookmarkDate}>
                            Disimpan {new Date(bm.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <a href={`/ebook/${slug}`} className={styles.bookmarkReadBtn}>Baca</a>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

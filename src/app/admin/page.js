'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import styles from './page.module.css'

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [ebooks, setEbooks] = useState([])
  const [stats, setStats] = useState({ totalEbooks: 0, totalViews: 0, totalChapters: 0, totalUsers: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [ebookSearch, setEbookSearch] = useState('')
  const [ebookSort, setEbookSort] = useState('views')
  const [saving, setSaving] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', session.user.id).single()

      if (profile?.role !== 'admin') { router.push('/'); return }

      const [{ data: usersData }, { data: ebooksData }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, username, role, updated_at').order('updated_at', { ascending: false }),
        supabase.from('novels').select('id, title, slug, cover_image_url, author, genre, rating, views, publish_status, created_at, profiles!author_id(full_name, username), chapters(id)').order('views', { ascending: false }),
      ])

      const allEbooks = ebooksData || []
      const totalViews = allEbooks.reduce((s, e) => s + (e.views || 0), 0)
      const totalChapters = allEbooks.reduce((s, e) => s + (e.chapters?.length || 0), 0)

      setUsers(usersData || [])
      setEbooks(allEbooks)
      setStats({
        totalEbooks: allEbooks.length,
        totalViews,
        totalChapters,
        totalUsers: usersData?.length || 0,
      })
      setLoading(false)
    }
    init()
  }, [router])

  const changeRole = async (userId, newRole) => {
    setSaving(userId)
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId)
    if (error) {
      setMessage('Gagal: ' + error.message)
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
      setMessage('Role berhasil diubah.')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(null)
  }

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase()
    return (u.full_name || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q)
  })

  const filteredEbooks = ebooks
    .filter(e => {
      const q = ebookSearch.toLowerCase()
      return (e.title || '').toLowerCase().includes(q) ||
        (e.profiles?.full_name || e.profiles?.username || e.author || '').toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (ebookSort === 'views') return (b.views || 0) - (a.views || 0)
      if (ebookSort === 'rating') return (b.rating || 0) - (a.rating || 0)
      if (ebookSort === 'chapters') return (b.chapters?.length || 0) - (a.chapters?.length || 0)
      if (ebookSort === 'terbaru') return new Date(b.created_at) - new Date(a.created_at)
      return 0
    })

  const formatViews = (n) => {
    if (!n) return '0'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return String(n)
  }

  const roleLabel = (r) => r === 'admin' ? 'Admin' : r === 'author' ? 'Penulis' : 'Pembaca'
  const roleClass = (r) => r === 'admin' ? styles.roleAdmin : r === 'author' ? styles.roleAuthor : styles.roleReader

  if (loading) return <div className={styles.loading}>Memuat...</div>

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Panel Admin</h1>
            <p className={styles.subtitle}>Kelola pengguna & analitik e-book</p>
          </div>
          <span className={styles.totalBadge}>{users.length} pengguna</span>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📚</span>
            <div>
              <div className={styles.statNum}>{stats.totalEbooks}</div>
              <div className={styles.statLbl}>Total E-book</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>👁️</span>
            <div>
              <div className={styles.statNum}>{formatViews(stats.totalViews)}</div>
              <div className={styles.statLbl}>Total Views</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📖</span>
            <div>
              <div className={styles.statNum}>{stats.totalChapters}</div>
              <div className={styles.statLbl}>Total Bab</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>👤</span>
            <div>
              <div className={styles.statNum}>{stats.totalUsers}</div>
              <div className={styles.statLbl}>Total Pengguna</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'users' ? styles.tabActive : ''}`} onClick={() => setActiveTab('users')}>👥 Pengguna</button>
          <button className={`${styles.tab} ${activeTab === 'analytics' ? styles.tabActive : ''}`} onClick={() => setActiveTab('analytics')}>📊 Analitik E-book</button>
        </div>

        {message && (
          <div className={`${styles.message} ${message.includes('Gagal') ? styles.error : styles.success}`}>{message}</div>
        )}

        {/* Tab Pengguna */}
        {activeTab === 'users' && (
          <>
            <input className={styles.search} placeholder="Cari nama atau username..." value={search} onChange={e => setSearch(e.target.value)} />
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Nama</th><th>Username</th><th>Role Saat Ini</th><th>Ubah Role</th></tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td>{u.full_name || <span className={styles.empty}>—</span>}</td>
                      <td>{u.username || <span className={styles.empty}>—</span>}</td>
                      <td><span className={`${styles.roleBadge} ${roleClass(u.role)}`}>{roleLabel(u.role || 'reader')}</span></td>
                      <td>
                        <select className={styles.roleSelect} value={u.role || 'reader'} disabled={saving === u.id} onChange={e => changeRole(u.id, e.target.value)}>
                          <option value="reader">Pembaca</option>
                          <option value="author">Penulis</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={4} className={styles.emptyRow}>Tidak ada pengguna ditemukan.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Tab Analitik */}
        {activeTab === 'analytics' && (
          <>
            <div className={styles.analyticsControls}>
              <input className={styles.search} style={{ margin: 0, flex: 1 }} placeholder="Cari judul atau penulis..." value={ebookSearch} onChange={e => setEbookSearch(e.target.value)} />
              <select className={styles.roleSelect} value={ebookSort} onChange={e => setEbookSort(e.target.value)}>
                <option value="views">Views Terbanyak</option>
                <option value="rating">Rating Tertinggi</option>
                <option value="chapters">Bab Terbanyak</option>
                <option value="terbaru">Terbaru</option>
              </select>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th>#</th><th>E-book</th><th>Penulis</th><th>Genre</th><th>Bab</th><th>Views</th><th>Rating</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {filteredEbooks.map((e, i) => (
                    <tr key={e.id}>
                      <td className={styles.rankNum}>{i + 1}</td>
                      <td>
                        <Link href={`/ebook/${e.slug || e.id}`} target="_blank" className={styles.ebookLink}>
                          <div className={styles.ebookCell}>
                            {e.cover_image_url
                              ? <img src={e.cover_image_url} alt={e.title} className={styles.miniCover} />
                              : <div className={styles.miniCoverPlaceholder}>{e.title?.[0]}</div>}
                            <span>{e.title}</span>
                          </div>
                        </Link>
                      </td>
                      <td>{e.profiles?.full_name || e.profiles?.username || e.author || '—'}</td>
                      <td>{e.genre || '—'}</td>
                      <td>{e.chapters?.length || 0}</td>
                      <td><strong>{formatViews(e.views)}</strong></td>
                      <td>{e.rating > 0 ? `⭐ ${Number(e.rating).toFixed(1)}` : '—'}</td>
                      <td>
                        <span className={`${styles.roleBadge} ${e.publish_status === 'published' ? styles.statusPublished : styles.statusDraft}`}>
                          {e.publish_status === 'published' ? 'Terbit' : 'Draf'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredEbooks.length === 0 && (
                    <tr><td colSpan={8} className={styles.emptyRow}>Tidak ada e-book ditemukan.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className={styles.totalInfo}>Menampilkan {filteredEbooks.length} dari {ebooks.length} e-book</p>
          </>
        )}
      </div>
    </main>
  )
}

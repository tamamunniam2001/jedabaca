'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from './page.module.css'

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', session.user.id).single()

      if (profile?.role !== 'admin') { router.push('/'); return }

      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, username, role, updated_at')
        .order('updated_at', { ascending: false })

      setUsers(data || [])
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

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return (u.full_name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q)
  })

  const roleLabel = (r) => r === 'admin' ? 'Admin' : r === 'author' ? 'Penulis' : 'Pembaca'
  const roleClass = (r) => r === 'admin' ? styles.roleAdmin : r === 'author' ? styles.roleAuthor : styles.roleReader

  if (loading) return <div className={styles.loading}>Memuat...</div>

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Panel Admin</h1>
            <p className={styles.subtitle}>Kelola role pengguna</p>
          </div>
          <span className={styles.totalBadge}>{users.length} pengguna</span>
        </div>

        {message && (
          <div className={`${styles.message} ${message.includes('Gagal') ? styles.error : styles.success}`}>
            {message}
          </div>
        )}

        <input
          className={styles.search}
          placeholder="Cari nama atau username..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Username</th>
                <th>Role Saat Ini</th>
                <th>Ubah Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>{u.full_name || <span className={styles.empty}>—</span>}</td>
                  <td>{u.username || <span className={styles.empty}>—</span>}</td>
                  <td>
                    <span className={`${styles.roleBadge} ${roleClass(u.role)}`}>
                      {roleLabel(u.role || 'reader')}
                    </span>
                  </td>
                  <td>
                    <select
                      className={styles.roleSelect}
                      value={u.role || 'reader'}
                      disabled={saving === u.id}
                      onChange={e => changeRole(u.id, e.target.value)}
                    >
                      <option value="reader">Pembaca</option>
                      <option value="author">Penulis</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className={styles.emptyRow}>Tidak ada pengguna ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}

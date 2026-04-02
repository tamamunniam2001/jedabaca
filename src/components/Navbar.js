'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from './Navbar.module.css'

export default function Navbar() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, username, avatar_url, role')
          .eq('id', session.user.id)
          .single()
        setUserProfile(data)
      }
    }
    getUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null)
      if (!session?.user) setUserProfile(null)
    })
    return () => subscription?.unsubscribe()
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setIsProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null); setUserProfile(null); setIsProfileOpen(false)
    router.push('/')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) router.push(`/explore?q=${encodeURIComponent(search.trim())}`)
  }

  const displayName = userProfile?.full_name || userProfile?.username || user?.email?.split('@')[0]
  const isAuthor = userProfile?.role === 'author' || userProfile?.role === 'admin'
  const isAdmin = userProfile?.role === 'admin'

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>Jeda Baca</Link>

        <div className={styles.navLinks}>
          <Link href="/explore" className={styles.link}>Jelajahi</Link>
          <Link href="/genres" className={styles.link}>Genre</Link>
          <Link href="/authors" className={styles.link}>Penulis</Link>
        </div>

        <form className={styles.searchForm} onSubmit={handleSearch}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Cari novel atau penulis..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </form>

        <div className={styles.rightSection}>
          {user ? (
            <div className={styles.userMenu} ref={dropdownRef}>
              <button className={styles.userBtn} onClick={() => setIsProfileOpen(!isProfileOpen)}>
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt={displayName} className={styles.avatar} />
                ) : (
                  <div className={styles.avatarInitial}>{displayName?.[0]?.toUpperCase() || 'U'}</div>
                )}
                <span className={styles.userName}>{displayName}</span>
                <span className={styles.chevron}>{isProfileOpen ? '▴' : '▾'}</span>
              </button>

              {isProfileOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <p className={styles.dropdownName}>{displayName}</p>
                    <p className={styles.dropdownEmail}>{user.email}</p>
                    <span className={styles.roleBadge}>{userProfile?.role || 'pembaca'}</span>
                  </div>
                  <div className={styles.dropdownDivider} />
                  <Link href="/profile" className={styles.dropdownLink} onClick={() => setIsProfileOpen(false)}>Profil Saya</Link>
                  {isAuthor && (
                    <Link href="/dashboard" className={styles.dropdownLink} onClick={() => setIsProfileOpen(false)}>Dasbor Penulis</Link>
                  )}
                  {isAdmin && (
                    <Link href="/admin" className={styles.dropdownLink} onClick={() => setIsProfileOpen(false)}>Panel Admin</Link>
                  )}
                  <Link href="/koleksi" className={styles.dropdownLink} onClick={() => setIsProfileOpen(false)}>Koleksi Saya</Link>
                  <div className={styles.dropdownDivider} />
                  <button className={styles.dropdownLogout} onClick={handleLogout}>Keluar</button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.authLinks}>
              <Link href="/auth" className={styles.loginBtn}>Masuk</Link>
              <Link href="/auth?tab=register" className={styles.registerBtn}>Daftar</Link>
            </div>
          )}
        </div>

        <button className={styles.menuBtn} onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Menu">
          <span className={styles.bar} />
          <span className={styles.bar} />
          <span className={styles.bar} />
        </button>
      </div>

      {isMenuOpen && (
        <div className={styles.mobileMenu}>
          <form className={styles.mobileSearch} onSubmit={handleSearch}>
            <input className={styles.mobileSearchInput} type="text" placeholder="Cari novel..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </form>
          <Link href="/explore" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>Jelajahi</Link>
          <Link href="/genres" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>Genre</Link>
          <Link href="/authors" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>Penulis</Link>
          {user ? (
            <>
              <div className={styles.mobileDivider} />
              <Link href="/profile" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>Profil Saya</Link>
              {isAuthor && (
                <Link href="/dashboard" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>Dasbor Penulis</Link>
              )}
              {isAdmin && (
                <Link href="/admin" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>Panel Admin</Link>
              )}
              <Link href="/koleksi" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>Koleksi Saya</Link>
              <button className={styles.mobileLogout} onClick={handleLogout}>Keluar</button>
            </>
          ) : (
            <>
              <div className={styles.mobileDivider} />
              <Link href="/auth" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>Masuk</Link>
              <Link href="/auth?tab=register" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>Daftar</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

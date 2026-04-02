'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from './page.module.css'

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  })

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/')
      }
    }
    checkUser()
  }, [router])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (signInError) throw signInError

        router.push('/')
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Password tidak cocok')
        }

        if (formData.password.length < 6) {
          throw new Error('Password minimal 6 karakter')
        }

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
            },
          },
        })

        if (signUpError) {
          console.error('Sign up error:', signUpError)
          throw signUpError
        }

        if (authData.user) {
          console.log('User created successfully:', authData.user.id)
        }

        setFormData({ email: '', password: '', confirmPassword: '', fullName: '' })
        setError('Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.')
        setTimeout(() => setIsLogin(true), 2000)
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.card}>
          {/* Header */}
          <div className={styles.header}>
            <h1 className={styles.title}>
              {isLogin ? 'Selamat Datang Kembali' : 'Bergabunglah dengan Kami'}
            </h1>
            <p className={styles.subtitle}>
              {isLogin
                ? 'Masuk ke akun Anda untuk melanjutkan'
                : 'Buat akun baru untuk memulai petualangan membaca e-book'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {!isLogin && (
              <div className={styles.formGroup}>
                <label htmlFor="fullName" className={styles.label}>Nama Lengkap</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap Anda"
                  className={styles.input}
                  disabled={loading}
                  required
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Masukkan email Anda"
                className={styles.input}
                disabled={loading}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Masukkan password"
                  className={styles.input}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className={styles.togglePasswordBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>Konfirmasi Password</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Konfirmasi password Anda"
                    className={styles.input}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className={styles.togglePasswordBtn}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className={`${styles.message} ${error.includes('berhasil') ? styles.success : styles.error}`}>
                {error.includes('berhasil') ? '✓' : '⚠️'} {error}
              </div>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Memproses...' : isLogin ? 'Masuk' : 'Daftar'}
            </button>
          </form>

          {/* Toggle */}
          <div className={styles.toggle}>
            <p>
              {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                  setShowPassword(false)
                  setShowConfirmPassword(false)
                  setFormData({ email: '', password: '', confirmPassword: '', fullName: '' })
                }}
              >
                {isLogin ? 'Daftar di sini' : 'Masuk di sini'}
              </button>
            </p>
          </div>
        </div>

        {/* Illustration */}
        <div className={styles.illustration}>
          <div className={styles.illustrationContent}>
            <h2 className={styles.illustrationTitle}>Jeda Baca</h2>
            <p className={styles.illustrationText}>
              Platform premium untuk membaca dan berbagi e-book terbaik
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

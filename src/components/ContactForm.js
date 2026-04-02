'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './ContactForm.module.css'

export default function ContactForm({ authorId, authorName, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

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
      // Validasi form
      if (!formData.name || !formData.email || !formData.subject || !formData.message) {
        throw new Error('Semua field harus diisi')
      }

      // Simpan pesan ke database (opsional)
      const { error: dbError } = await supabase
        .from('contact_messages')
        .insert([
          {
            author_id: authorId,
            sender_name: formData.name,
            sender_email: formData.email,
            subject: formData.subject,
            message: formData.message,
            created_at: new Date().toISOString(),
          },
        ])

      if (dbError && dbError.code !== 'PGRST116') {
        throw dbError
      }

      setSuccess(true)
      setFormData({ name: '', email: '', subject: '', message: '' })

      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat mengirim pesan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Hubungi {authorName}</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {success ? (
          <div className={styles.successMessage}>
            <span className={styles.successIcon}>✓</span>
            <p>Pesan Anda telah terkirim!</p>
            <p className={styles.successSubtext}>Terima kasih telah menghubungi penulis.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>Nama Anda</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Masukkan nama Anda"
                className={styles.input}
                disabled={loading}
              />
            </div>

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
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="subject" className={styles.label}>Subjek</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Masukkan subjek pesan"
                className={styles.input}
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message" className={styles.label}>Pesan</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tulis pesan Anda di sini..."
                className={styles.textarea}
                rows="5"
                disabled={loading}
              />
            </div>

            {error && (
              <div className={styles.errorMessage}>
                ⚠️ {error}
              </div>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
                disabled={loading}
              >
                Batal
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
              >
                {loading ? 'Mengirim...' : 'Kirim Pesan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

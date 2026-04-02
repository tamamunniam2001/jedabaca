'use client'
import { useEffect, useState } from 'react'
import styles from './PWAInstaller.module.css'

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className={styles.container}>
      <div className={styles.banner}>
        <div className={styles.content}>
          <div className={styles.icon}>📱</div>
          <div className={styles.text}>
            <h3 className={styles.title}>Instal Jeda Baca</h3>
            <p className={styles.description}>Akses aplikasi langsung dari layar utama Anda</p>
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.installBtn} onClick={handleInstall}>
            Instal
          </button>
          <button className={styles.dismissBtn} onClick={handleDismiss}>
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

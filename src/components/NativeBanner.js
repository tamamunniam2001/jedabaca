'use client'
import { useEffect } from 'react'

export default function NativeBanner() {
  useEffect(() => {
    const script = document.createElement('script')
    script.async = true
    script.setAttribute('data-cfasync', 'false')
    script.src = 'https://pl29045875.profitablecpmratenetwork.com/860e3a6329b3773b232ec37abec195cd/invoke.js'
    document.getElementById('container-860e3a6329b3773b232ec37abec195cd')?.appendChild(script)
  }, [])

  return (
    <div style={{
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 1.5rem',
      aspectRatio: '4 / 1',
      overflow: 'hidden',
    }}>
      <div id="container-860e3a6329b3773b232ec37abec195cd" style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

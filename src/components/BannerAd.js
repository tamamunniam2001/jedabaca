'use client'
import { useEffect } from 'react'

export default function BannerAd() {
  useEffect(() => {
    const script1 = document.createElement('script')
    script1.innerHTML = `atOptions = {'key':'416cc5ceaa38e30da21be853dad565c9','format':'iframe','height':90,'width':728,'params':{}};`
    document.body.appendChild(script1)

    const script2 = document.createElement('script')
    script2.src = 'https://www.highperformanceformat.com/416cc5ceaa38e30da21be853dad565c9/invoke.js'
    script2.async = true
    document.body.appendChild(script2)
  }, [])

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#f5f5f5',
      padding: '0.5rem 0',
      overflow: 'hidden',
    }}>
      <div style={{ maxWidth: '728px', width: '100%' }} />
    </div>
  )
}

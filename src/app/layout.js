import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PWAInstaller from '@/components/PWAInstaller'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import Script from 'next/script'

export const metadata = {
  title: 'Jeda Baca - Baca E-book Online',
  description: 'Platform membaca dan berbagi e-book Indonesia',
  manifest: '/manifest.json',
  verification: {
    google: 'iF1OO-P86wQWtIZoA0cYJtlwQQTmE00S_EN5Es0H4J0',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" type="image/png" href="/icon-192.png" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://ewsxditmxzbyedhzwgps.supabase.co" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
      </head>
      <body>
        <Navbar />
        {children}
        <Footer />
        <PWAInstaller />
        <ServiceWorkerRegister />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7860007029832598"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script
          src="https://5gvci.com/act/files/tag.min.js?z=10823010"
          data-cfasync="false"
          async
          strategy="afterInteractive"
        />
        <Script id="monetag-vignette" strategy="afterInteractive">{`(function(s){s.dataset.zone='10823012',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`}</Script>
        <Script id="monetag-zone-2" strategy="afterInteractive">{`(function(s){s.dataset.zone='10823018',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`}</Script>
      </body>
    </html>
  )
}

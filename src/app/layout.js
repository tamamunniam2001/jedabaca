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
          src="https://quge5.com/88/tag.min.js"
          data-zone="225902"
          async
          data-cfasync="false"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}

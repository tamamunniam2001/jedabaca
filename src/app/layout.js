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
        <link rel="preconnect" href="https://5gvci.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://n6wxm.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://nap5k.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://ewsxditmxzbyedhzwgps.supabase.co" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-61ER68V4M3" />
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-61ER68V4M3');` }} />
        {/* Monetag */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var s=document.createElement('script');s.src='https://5gvci.com/act/files/tag.min.js?z=10823010';s.async=true;s.setAttribute('data-cfasync','false');document.head.appendChild(s);})()` }} />
        <script dangerouslySetInnerHTML={{ __html: `(function(s){s.dataset.zone='10823012',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement,document.body].filter(Boolean).pop().appendChild(document.createElement('script')))` }} />
        <script dangerouslySetInnerHTML={{ __html: `(function(s){s.dataset.zone='10823018',s.src='https://nap5k.com/tag.min.js'})([document.documentElement,document.body].filter(Boolean).pop().appendChild(document.createElement('script')))` }} />
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
      </body>
    </html>
  )
}

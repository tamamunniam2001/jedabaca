import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PWAInstaller from '@/components/PWAInstaller'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

export const metadata = {
  title: 'Jeda Baca - Baca E-book Online',
  description: 'Platform membaca dan berbagi e-book Indonesia',
  manifest: '/manifest.json',
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
      </head>
      <body>
        <Navbar />
        {children}
        <Footer />
        <PWAInstaller />
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}

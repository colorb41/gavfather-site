import fs from 'fs'
import path from 'path'
import { Cinzel, Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { SITE_NAME, SITE_URL } from '../lib/site'
import '../styles/globals.css'

function getDraftBannerDate() {
  const fallback = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const candidates = [
    path.join(process.cwd(), 'public', 'data', 'meta.json'),
    path.join(process.cwd(), 'data', 'meta.json'),
  ]
  for (const filePath of candidates) {
    try {
      if (!fs.existsSync(filePath)) continue
      const meta = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      const raw = meta?.last_updated
      if (!raw) continue
      const parsed = new Date(raw)
      if (Number.isNaN(parsed.getTime())) return String(raw)
      return parsed.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      // fall through
    }
  }
  return fallback
}

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
  weight: ['400', '600', '700'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['500', '700'],
})

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | 2026 Fantasy Football Draft Rankings`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Data-driven fantasy football rankings, sleeper picks, and hard fades from The Gavfather.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | 2026 Fantasy Football Draft Rankings`,
    description:
      'Fantasy football rankings, sleepers, and hard fades — driven by the model, not the podcasts.',
    images: [{ url: '/images/og_image.png', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | 2026 Fantasy Football Draft Rankings`,
    description:
      'Fantasy football rankings, sleepers, and hard fades — driven by the model, not the podcasts.',
    images: ['/images/og_image.png'],
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }) {
  const bannerDate = getDraftBannerDate()

  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body className="flex min-h-screen flex-col bg-gavfather-navy font-body text-gavfather-text antialiased">
        <Navbar />
        <div className="bg-gavfather-gold px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-gavfather-navy md:text-sm">
          🏈 2026 Draft Season — Rankings updated {bannerDate}
        </div>
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}

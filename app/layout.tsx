import type { Metadata } from 'next'
import { Inter, Sora } from 'next/font/google'
import ThemeProvider from '@/components/ThemeProvider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Unlinked - Say what you can\'t say anywhere else',
  description: 'An anonymous, behavior-driven social platform for raw thoughts, confessions, opinions and micro-stories. No filters. No personal branding. Just real.',
  keywords: ['anonymous', 'social', 'confessions', 'unfiltered', 'honest', 'India'],
  openGraph: {
    title: 'Unlinked',
    description: 'Say what you can\'t say anywhere else.',
    siteName: 'Unlinked',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`} suppressHydrationWarning>
      <body className="app-root">
        <ThemeProvider />
        <div className="app-surface">{children}</div>
      </body>
    </html>
  )
}

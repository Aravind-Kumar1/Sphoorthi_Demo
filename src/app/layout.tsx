import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono, Outfit, Poppins } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import SyncUser from '@/components/SyncUser'
import Header from '@/components/Header'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
})

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'SPHOORTHI KUTUMBAM | Pro Dashboard',
  description: 'SPHOORTHI KUTUMBAM Premium SaaS Dashboard',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} ${poppins.variable}`} suppressHydrationWarning>
        <body suppressHydrationWarning>
          <Toaster 
            position="bottom-right" 
            toastOptions={{
              style: {
                background: '#000000',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '0.9rem',
                borderRadius: '10px',
              },
              success: {
                iconTheme: { primary: '#4ade80', secondary: '#000' }
              },
              error: {
                iconTheme: { primary: '#f87171', secondary: '#000' }
              }
            }}
          />
          <SyncUser />
          <Header />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}

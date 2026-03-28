import type { Metadata } from 'next'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  UserButton,
  Show,
} from '@clerk/nextjs'
import { Geist, Geist_Mono, Outfit } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import SyncUser from '@/components/SyncUser'
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

export const metadata: Metadata = {
  title: 'Sphoorthi Kutumbam | Pro Dashboard',
  description: 'Sphoorthi Kutumbam Premium SaaS Dashboard',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22black%22/><path d=%22M30 30h40v40H30z%22 fill=%22%237c63f5%22 opacity=%22.8%22/><path d=%22M50 20v60M20 50h60%22 stroke=%22white%22 stroke-width=%228%22 stroke-linecap=%22round%22/></svg>',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable}`} suppressHydrationWarning>
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
          <header className="site-header">
            <span className="site-header__brand">Sphoorthi Kutumbam</span>
            <div className="site-header__auth">
              {/* Only show when NOT logged in */}
              <Show when="signed-out">
                <SignInButton mode="modal" forceRedirectUrl="/dashboard"><button className="btn-signin">Sign In</button></SignInButton>
                <SignUpButton mode="modal" forceRedirectUrl="/dashboard"><button className="btn-signup">Sign Up</button></SignUpButton>
              </Show>

              {/* Only show when logged in */}
              <Show when="signed-in">
                <UserButton />
              </Show>
            </div>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}

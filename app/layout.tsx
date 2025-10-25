import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { AuthProvider } from '@/components/providers/auth-provider'
import SabiBot from '@/components/chat/sabibot'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'arial']
})

export const metadata: Metadata = {
  title: 'Sabitek - Learn Anything, Anywhere',
  description: 'Empowering African education through technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <AuthProvider>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <SabiBot />
        </AuthProvider>
      </body>
    </html>
  )
}
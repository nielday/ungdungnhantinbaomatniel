import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthContext'
import { SocketProvider } from '@/components/SocketContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ứng Dụng Nhắn Tin Bảo Mật Niel',
  description: 'Ứng dụng nhắn tin bảo mật với mã hóa end-to-end, hỗ trợ đa ngôn ngữ và giao diện thân thiện',
  openGraph: {
    title: 'Ứng Dụng Nhắn Tin Bảo Mật Niel',
    description: 'Ứng dụng nhắn tin bảo mật với mã hóa end-to-end, hỗ trợ đa ngôn ngữ và giao diện thân thiện',
    type: 'website',
    locale: 'vi_VN',
  },
  twitter: {
    card: 'summary',
    title: 'Ứng Dụng Nhắn Tin Bảo Mật Niel',
    description: 'Ứng dụng nhắn tin bảo mật với mã hóa end-to-end, hỗ trợ đa ngôn ngữ và giao diện thân thiện',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <AuthProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

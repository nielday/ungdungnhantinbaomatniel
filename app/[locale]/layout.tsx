import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'
import { AuthProvider } from '@/components/AuthContext'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ứng Dụng Nhắn Tin Bảo Mật Niel',
  description: 'Ứng dụng nhắn tin bảo mật với mã hóa end-to-end, hỗ trợ đa ngôn ngữ và giao diện thân thiện',
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const messages = await getMessages({ locale })

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

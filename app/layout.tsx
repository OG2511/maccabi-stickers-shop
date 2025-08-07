import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { Header } from "@/components/header"
import { Toaster } from "@/components/ui/toaster"
import { WhatsAppSupport } from "@/components/whatsapp-support"
import { AutoLocationRequest } from "@/components/auto-location-request"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "מכבי מדבקות - חנות המדבקות הרשמית",
  description: "חנות המדבקות הרשמית של מכבי חיפה. מגוון רחב של מדבקות מכל הקולקציות",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Toaster />
        <WhatsAppSupport />
        <AutoLocationRequest />
      </body>
    </html>
  )
}

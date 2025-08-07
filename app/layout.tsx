import type React from "react"
import type { Metadata } from "next"
import { Assistant } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { Header } from "@/components/header"
import { CartProvider } from "@/hooks/use-cart"
import { Toaster } from "@/components/ui/toaster"
import { WhatsAppSupport } from "@/components/whatsapp-support"
import { AutoLocationRequest } from "@/components/auto-location-request"

const assistant = Assistant({ subsets: ["hebrew"] })

export const metadata: Metadata = {
  title: "מכבי חיפה סטיקרס",
  description: "החנות הרשמית למדבקות של מכבי חיפה",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={cn("min-h-screen bg-background font-sans antialiased", assistant.className)}>
        <CartProvider>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
          <WhatsAppSupport />
          <AutoLocationRequest />
        </CartProvider>
      </body>
    </html>
  )
}

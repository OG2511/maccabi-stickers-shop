"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Cart } from "@/components/cart"
import { useCart } from "@/hooks/use-cart"

export function Header() {
  const { totalItems } = useCart()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary backdrop-blur supports-[backdrop-filter]:bg-primary shadow-lg">
      <div className="container flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="relative border border-white rounded-full shadow-lg"
            style={{
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
            }}
          >
            <Image src="/logo.png" alt="מכבי חיפה סטיקרס לוגו" width={48} height={48} className="rounded-full" />
          </div>
          <span className="hidden md:inline-block font-bold text-lg text-white drop-shadow-md">מכבי חיפה סטיקרס</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="transition-colors hover:text-white/80 text-white drop-shadow-sm">
            בית
          </Link>
          <Link href="/shop" className="transition-colors hover:text-white/80 text-white drop-shadow-sm">
            חנות
          </Link>
        </nav>
        <Cart>
          <Button
            variant="outline"
            size="icon"
            className="relative bg-white/10 border-white/20 hover:bg-white/20 text-white"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs text-primary font-bold shadow-md">
                {totalItems}
              </span>
            )}
          </Button>
        </Cart>
      </div>
    </header>
  )
}

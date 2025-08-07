"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Instagram } from "lucide-react"

// קומפוננטה לתצוגה מקדימה של דף הבית
export function HomepagePreview() {
  return (
    <div className="w-[1024px] h-[1024px] relative overflow-hidden bg-hero-4 bg-cover bg-center bg-no-repeat">
      <div className="absolute inset-0 bg-black/60" />

      {/* Header */}
      <div className="relative z-10 bg-primary h-20 flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="לוגו" width={48} height={48} className="rounded-full" />
          <span className="font-bold text-lg text-white">מכבי חיפה סטיקרס</span>
        </div>
        <nav className="flex items-center gap-6 text-white">
          <span>בית</span>
          <span>חנות</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-[calc(100%-80px)] text-white text-center p-8">
        {/* Logo */}
        <div className="mb-12">
          <Image
            src="/logo.png"
            alt="מכבי חיפה סטיקרס לוגו"
            width={300}
            height={300}
            className="drop-shadow-2xl"
            style={{
              filter: "drop-shadow(0 0 0 3px white) drop-shadow(0 10px 20px rgba(0,0,0,0.5))",
            }}
          />
        </div>

        <h1 className="text-6xl font-extrabold tracking-tight drop-shadow-lg mb-8">ברוכים הבאים לחנות המדבקות</h1>

        <Button size="lg" className="bg-primary hover:bg-primary/90 text-xl px-12 py-6 mb-8">
          לחנות
        </Button>

        {/* Instagram Link */}
        <div className="flex items-center gap-3 text-white">
          <Instagram className="h-10 w-10" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }} />
          <span className="text-xl font-medium drop-shadow-md">עקבו אחרינו באינסטגרם</span>
        </div>
      </div>
    </div>
  )
}

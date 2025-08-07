import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Instagram } from "lucide-react"

export default function HomePage({
  searchParams,
}: {
  searchParams: { payment?: string }
}) {
  return (
    <div className="flex h-[calc(100vh-5rem)] w-full flex-col items-center justify-center bg-hero-4 bg-cover bg-center bg-no-repeat">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 flex flex-col items-center text-center text-white p-4">
        {/* Logo with white stroke and shadow - reduced size */}
        <div className="mb-8">
          <Image
            src="/logo.png"
            alt="מכבי חיפה סטיקרס לוגו"
            width={200}
            height={200}
            className="drop-shadow-2xl"
            style={{
              filter: "drop-shadow(0 0 0 3px white) drop-shadow(0 10px 20px rgba(0,0,0,0.5))",
            }}
            priority
          />
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl drop-shadow-lg">
          ברוכים הבאים לחנות המדבקות
        </h1>

        {searchParams.payment === "initiated" && (
          <div className="mt-4 p-4 bg-green-600 rounded-lg">
            <p className="text-white font-semibold">ההזמנה נשלחה בהצלחה!</p>
            <p className="text-white text-sm">חלון התשלום נפתח בטאב חדש</p>
          </div>
        )}

        <Button asChild size="lg" className="mt-8 bg-primary hover:bg-primary/90 text-lg px-8 py-4">
          <Link href="/shop">לחנות</Link>
        </Button>

        {/* Instagram Link */}
        <Link
          href="https://www.instagram.com/maccabihaifastickers"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center gap-2 text-white hover:text-white/80 transition-colors"
        >
          <Instagram className="h-8 w-8" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }} />
          <span className="text-lg font-medium drop-shadow-md">עקבו אחרינו באינסטגרם</span>
        </Link>
      </div>
    </div>
  )
}

import { createClient } from "@/lib/supabase/server"
import { ProductCard } from "@/components/product-card"
import type { Product } from "@/lib/types"
import { getCollectionDisplayName } from "@/lib/types"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Star, ChevronDown } from "lucide-react"

// Force dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic"
export const revalidate = 0 // Revalidate data on every request

export default async function ShopPage() {
  console.log("🏪 Loading shop page...")

  const supabase = createClient()

  // Add timestamp to ensure fresh data
  const timestamp = Date.now()
  console.log("🏪 Fetching products at:", new Date(timestamp).toISOString())

  const { data: products, error } = await supabase.from("products").select("*").order("collection", { ascending: true })

  if (error) {
    console.error("🔴 Error fetching products:", error)
    return <p className="text-center text-red-500">Error loading products.</p>
  }

  console.log("🏪 Fetched", products?.length || 0, "products")

  if (!products || products.length === 0) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center">הקולקציות שלנו</h1>
        <p className="text-center text-gray-500">אין מוצרים להצגה כרגע</p>
      </div>
    )
  }

  const collections = products.reduce(
    (acc, product) => {
      const collectionName = product.collection
      if (!acc[collectionName]) {
        acc[collectionName] = []
      }
      acc[collectionName].push(product)
      return acc
    },
    {} as Record<string, Product[]>,
  )

  console.log("🏪 Collections found:", Object.keys(collections))

  // Sort products within each collection by name (handling numbers correctly)
  Object.keys(collections).forEach((collectionName) => {
    console.log(`🔍 Sorting collection: ${collectionName}`)

    // Log products before sorting
    console.log(
      "Before sorting:",
      collections[collectionName].map((p) => p.name),
    )

    collections[collectionName].sort((a, b) => {
      // Extract numbers after dash/hyphen from product names
      const getNumberAfterDash = (name: string) => {
        // Look for pattern like "- 5" or "- 10"
        const match = name.match(/- (\d+)/)
        const num = match ? Number.parseInt(match[1], 10) : null
        console.log(`📝 "${name}" -> number after dash: ${num}`)
        return num
      }

      const numA = getNumberAfterDash(a.name)
      const numB = getNumberAfterDash(b.name)

      console.log(`🔄 Comparing "${a.name}" (${numA}) vs "${b.name}" (${numB})`)

      // If both have numbers, sort by number
      if (numA !== null && numB !== null) {
        const result = numA - numB
        console.log(`📊 Both have numbers: ${numA} - ${numB} = ${result}`)
        return result
      }

      // If only one has a number, number comes first
      if (numA !== null && numB === null) {
        console.log(`📊 Only A has number: A comes first`)
        return -1
      }
      if (numA === null && numB !== null) {
        console.log(`📊 Only B has number: B comes first`)
        return 1
      }

      // If neither has numbers, sort alphabetically
      console.log(`📊 Neither has numbers: alphabetical sort`)
      if (a.name < b.name) return -1
      if (a.name > b.name) return 1
      return 0
    })

    // Log products after sorting
    console.log(
      "After sorting:",
      collections[collectionName].map((p) => p.name),
    )
  })

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">הקולקציות שלנו</h1>

      {/* Debug info */}
      <div className="mb-4 text-xs text-gray-400 text-center">
        נטען ב-{new Date().toLocaleTimeString("he-IL")} | {products.length} מוצרים
      </div>

      {/* ✅ Fixed: Accordion opens downward with proper styling */}
      <Accordion type="multiple" className="w-full space-y-4" defaultValue={Object.keys(collections)}>
        {Object.entries(collections).map(([collectionName, products]) => {
          const displayName = getCollectionDisplayName(collectionName)

          return (
            <AccordionItem
              value={collectionName}
              key={collectionName}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="text-xl font-semibold py-6 px-6 hover:bg-gray-50 transition-colors [&[data-state=open]>svg]:rotate-180">
                <div className="flex items-center gap-3 flex-1">
                  {collectionName === "מיוחדים" && <Star className="h-6 w-6 text-amber-500" />}
                  <span className="text-right flex-1">{displayName}</span>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {products.length} מוצרים
                  </span>
                </div>
                <ChevronDown className="h-5 w-5 text-gray-500 transition-transform duration-200 ml-4" />
              </AccordionTrigger>
              <AccordionContent className="pb-0">
                <div className="border-t border-gray-100">
                  {collectionName === "מיוחדים" && (
                    <div className="mx-6 mt-4 mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="text-sm text-amber-800 space-y-2">
                        <p className="font-medium flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          תנאים לרכישת מדבקות מיוחדות:
                        </p>
                        <ul className="list-disc list-inside space-y-1 mr-4">
                          <li>חובה להוסיף לפחות 10 מדבקות רגילות לסל קודם</li>
                          <li>מקסימום 3 מדבקות מיוחדות להזמנה</li>
                          <li>המדבקות המיוחדות לא כלולות בהנחות כמות</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 p-6">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}

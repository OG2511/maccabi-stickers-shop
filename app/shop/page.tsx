import { createClient } from "@/lib/supabase/server"
import { ProductCard } from "@/components/product-card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { Product } from "@/lib/types"

export default async function ShopPage() {
  const supabase = createClient()
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("collection", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    return <p className="text-center text-red-500">שגיאה בטעינת המוצרים. נסה לרענן את העמוד.</p>
  }

  const collections = products.reduce((acc: { [key: string]: Product[] }, product) => {
    const collectionName = product.collection || "אחר"
    if (!acc[collectionName]) {
      acc[collectionName] = []
    }
    acc[collectionName].push(product)
    return acc
  }, {})

  const collectionOrder = [
    "רגילות",
    "מיוחדים",
    "סדרת האסים",
    "אולטראס",
    "קבוצות אחרות",
    "שונות",
  ]

  const sortedCollectionNames = Object.keys(collections).sort((a, b) => {
    const indexA = collectionOrder.indexOf(a)
    const indexB = collectionOrder.indexOf(b)
    if (indexA !== -1 && indexB !== -1) return indexA - indexB
    if (indexA !== -1) return -1
    if (indexB !== -1) return 1
    return a.localeCompare(b)
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-primary">חנות המדבקות</h1>
      
      <Accordion type="multiple" defaultValue={sortedCollectionNames} className="w-full">
        {sortedCollectionNames.map((collectionName) => (
          <AccordionItem value={collectionName} key={collectionName}>
            <AccordionTrigger className="text-2xl font-semibold">
              {collectionName} ({collections[collectionName].length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {collections[collectionName].map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

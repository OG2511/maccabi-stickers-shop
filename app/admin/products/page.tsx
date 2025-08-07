import { createClient } from "@/lib/supabase/server"
import { AddProductDialog } from "./add-product-dialog"
import { EditProductDialog } from "./edit-product-dialog"
import { DeleteProductButton } from "./delete-product-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, Filter, Package } from "lucide-react"
import Image from "next/image"
import type { Product } from "@/lib/types"
import { COLLECTIONS, getCollectionDisplayName } from "@/lib/types"

const collectionsWithAll = ["הכל", ...COLLECTIONS]

interface PageProps {
  searchParams: {
    collection?: string
    search?: string
    success?: string
    error?: string
  }
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const supabase = createClient()

  let query = supabase.from("products").select("*")

  // Apply collection filter
  if (searchParams.collection && searchParams.collection !== "הכל") {
    query = query.eq("collection", searchParams.collection)
  }

  // Apply search filter
  if (searchParams.search) {
    query = query.ilike("name", `%${searchParams.search}%`)
  }

  const { data: products, error } = await query.order("created_at", { ascending: false })

  // Get inventory statistics
  const { data: inventoryStats } = await supabase.from("products").select("stock, price, collection")

  const totalStock = inventoryStats?.reduce((sum, product) => sum + product.stock, 0) || 0
  const totalValue = inventoryStats?.reduce((sum, product) => sum + product.stock * product.price, 0) || 0
  const totalProducts = products?.length || 0

  if (error) {
    console.error("Error fetching products:", error)
    return <div className="p-6">Error loading products</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">ניהול מוצרים</h1>
        <AddProductDialog />
      </div>

      {/* Inventory Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ מוצרים</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">מוצרים פעילים</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ מדבקות במלאי</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalStock.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">יחידות במלאי</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ערך המלאי</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₪{totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">ערך כולל</p>
          </CardContent>
        </Card>
      </div>

      {/* Success/Error Messages */}
      {searchParams.success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">המוצר נמחק בהצלחה</div>
      )}
      {searchParams.error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">שגיאה במחיקת המוצר</div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <Select defaultValue={searchParams.collection || "הכל"}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="בחר קולקציה" />
            </SelectTrigger>
            <SelectContent>
              {collectionsWithAll.map((collection) => (
                <SelectItem key={collection} value={collection}>
                  {collection === "הכל" ? collection : getCollectionDisplayName(collection)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <Input placeholder="חפש מוצר..." defaultValue={searchParams.search || ""} className="w-64" />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products?.map((product: Product) => (
          <Card key={product.id} className="overflow-hidden">
            <CardHeader className="p-4">
              <div className="aspect-square relative mb-2">
                {product.image_url ? (
                  <Image
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                    <span className="text-gray-400">אין תמונה</span>
                  </div>
                )}
              </div>
              <CardTitle className="text-lg">{product.name}</CardTitle>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-green-600">₪{product.price}</span>
                <Badge variant="secondary">{getCollectionDisplayName(product.collection)}</Badge>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span
                  className={`font-medium ${product.stock < 10 ? "text-red-600" : product.stock < 20 ? "text-orange-600" : "text-green-600"}`}
                >
                  מלאי: {product.stock}
                </span>
                <span>נוצר: {new Date(product.created_at).toLocaleDateString("he-IL")}</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex gap-2">
                <EditProductDialog product={product} />
                <DeleteProductButton productId={product.id} productName={product.name} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">לא נמצאו מוצרים</p>
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">סטטיסטיקות מפורטות</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
          <div>סה"כ מוצרים: {totalProducts}</div>
          <div>סה"כ מדבקות: {totalStock.toLocaleString()}</div>
          <div>ערך מלאי: ₪{totalValue.toLocaleString()}</div>
          <div>מחיר ממוצע: ₪{totalProducts > 0 ? (totalValue / totalStock).toFixed(2) : "0"}</div>
        </div>
      </div>
    </div>
  )
}

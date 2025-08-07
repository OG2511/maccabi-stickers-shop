"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Download, FileSpreadsheet, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import * as XLSX from "xlsx"

interface OriginalStockData {
  id: string
  name: string
  collection: string
  current_stock: number
  confirmed_orders: number
  pending_orders: number
  rejected_orders: number
  original_stock_estimate: number
  price: number
  total_value: number
  sales_percentage: number
  image_url: string
}

export function OriginalStockExporter() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchOriginalStockData = async (): Promise<OriginalStockData[]> => {
    const supabase = createClient()

    // Get products with their current stock
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, collection, stock, price, image_url")
      .order("collection", { ascending: true })
      .order("name", { ascending: true })

    if (productsError) throw productsError

    // Get order items with order status
    const { data: orderItems, error: orderItemsError } = await supabase.from("order_items").select(`
        product_id,
        quantity,
        orders!inner(status)
      `)

    if (orderItemsError) throw orderItemsError

    // Process data
    const stockData: OriginalStockData[] = products.map((product) => {
      const productOrderItems = orderItems.filter((item) => item.product_id === product.id)

      const confirmedOrders = productOrderItems
        .filter((item) => item.orders.status === "confirmed")
        .reduce((sum, item) => sum + item.quantity, 0)

      const pendingOrders = productOrderItems
        .filter((item) => item.orders.status === "pending")
        .reduce((sum, item) => sum + item.quantity, 0)

      const rejectedOrders = productOrderItems
        .filter((item) => item.orders.status === "rejected")
        .reduce((sum, item) => sum + item.quantity, 0)

      // Original stock estimate = current stock + confirmed orders
      const originalStockEstimate = product.stock + confirmedOrders

      const salesPercentage = originalStockEstimate > 0 ? (confirmedOrders / originalStockEstimate) * 100 : 0

      return {
        id: product.id,
        name: product.name,
        collection: product.collection,
        current_stock: product.stock,
        confirmed_orders: confirmedOrders,
        pending_orders: pendingOrders,
        rejected_orders: rejectedOrders,
        original_stock_estimate: originalStockEstimate,
        price: product.price,
        total_value: originalStockEstimate * product.price,
        sales_percentage: Math.round(salesPercentage * 100) / 100,
        image_url: product.image_url,
      }
    })

    return stockData
  }

  const exportToExcel = async () => {
    setLoading(true)
    try {
      const data = await fetchOriginalStockData()

      // Create workbook
      const wb = XLSX.utils.book_new()

      // Sheet 1: Detailed Data
      const detailedData = data.map((item) => ({
        "שם המוצר": item.name,
        קולקציה: item.collection,
        "מלאי נוכחי": item.current_stock,
        "הזמנות מאושרות": item.confirmed_orders,
        "הזמנות ממתינות": item.pending_orders,
        "הזמנות נדחות": item.rejected_orders,
        "מלאי מקורי משוער": item.original_stock_estimate,
        "מחיר ליחידה": `₪${item.price}`,
        "ערך כולל": `₪${item.total_value}`,
        "אחוז מכירות": `${item.sales_percentage}%`,
      }))

      const ws1 = XLSX.utils.json_to_sheet(detailedData)
      XLSX.utils.book_append_sheet(wb, ws1, "נתונים מפורטים")

      // Sheet 2: Summary by Collection
      const collectionSummary = data.reduce(
        (acc, item) => {
          if (!acc[item.collection]) {
            acc[item.collection] = {
              collection: item.collection,
              products_count: 0,
              current_stock: 0,
              original_stock: 0,
              confirmed_orders: 0,
              total_value: 0,
            }
          }

          acc[item.collection].products_count += 1
          acc[item.collection].current_stock += item.current_stock
          acc[item.collection].original_stock += item.original_stock_estimate
          acc[item.collection].confirmed_orders += item.confirmed_orders
          acc[item.collection].total_value += item.total_value

          return acc
        },
        {} as Record<string, any>,
      )

      const collectionData = Object.values(collectionSummary).map((item: any) => ({
        קולקציה: item.collection,
        "מספר מוצרים": item.products_count,
        "מלאי נוכחי": item.current_stock,
        "מלאי מקורי משוער": item.original_stock,
        "יחידות שנמכרו": item.confirmed_orders,
        "ערך כולל": `₪${item.total_value}`,
        "אחוז מכירות": `${item.original_stock > 0 ? Math.round((item.confirmed_orders / item.original_stock) * 10000) / 100 : 0}%`,
      }))

      const ws2 = XLSX.utils.json_to_sheet(collectionData)
      XLSX.utils.book_append_sheet(wb, ws2, "סיכום לפי קולקציה")

      // Sheet 3: Overall Summary
      const totalProducts = data.length
      const totalCurrentStock = data.reduce((sum, item) => sum + item.current_stock, 0)
      const totalOriginalStock = data.reduce((sum, item) => sum + item.original_stock_estimate, 0)
      const totalConfirmedOrders = data.reduce((sum, item) => sum + item.confirmed_orders, 0)
      const totalValue = data.reduce((sum, item) => sum + item.total_value, 0)
      const overallSalesPercentage = totalOriginalStock > 0 ? (totalConfirmedOrders / totalOriginalStock) * 100 : 0

      const summaryData = [
        { נתון: "סה״כ מוצרים", ערך: totalProducts },
        { נתון: "מלאי נוכחי כולל", ערך: totalCurrentStock },
        { נתון: "מלאי מקורי משוער", ערך: totalOriginalStock },
        { נתון: "יחידות שנמכרו", ערך: totalConfirmedOrders },
        { נתון: "ערך כולל של המלאי", ערך: `₪${totalValue}` },
        { נתון: "אחוז מכירות כללי", ערך: `${Math.round(overallSalesPercentage * 100) / 100}%` },
        { נתון: "תאריך הדוח", ערך: new Date().toLocaleDateString("he-IL") },
        { נתון: "שעת הדוח", ערך: new Date().toLocaleTimeString("he-IL") },
      ]

      const ws3 = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, ws3, "סיכום כללי")

      // Generate and download file
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `מלאי-מקורי-${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "הצלחה",
        description: "קובץ האקסל נוצר ורד בהצלחה",
      })
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      toast({
        title: "שגיאה",
        description: "שגיאה ביצירת קובץ האקסל",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          ייצוא מלאי מקורי
        </CardTitle>
        <CardDescription>ייצא קובץ אקסל מפורט עם המלאי המקורי המשוער של כל המוצרים לפני ההזמנות</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>הקובץ יכלול:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>נתונים מפורטים לכל מוצר</li>
              <li>סיכום לפי קולקציה</li>
              <li>סיכום כללי של המלאי</li>
              <li>חישוב מלאי מקורי = מלאי נוכחי + הזמנות מאושרות</li>
            </ul>
          </div>

          <Button onClick={exportToExcel} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                מייצא...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                ייצא מלאי מקורי לאקסל
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

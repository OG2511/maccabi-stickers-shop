"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { AlertTriangle, Package, TrendingDown, Download } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { OriginalStockExporter } from "./original-stock-exporter"
import * as XLSX from "xlsx"

interface InventoryItem {
  id: string
  name: string
  collection: string
  current_stock: number
  confirmed_orders: number
  pending_orders: number
  all_orders: number
  available_after_confirmed: number
  available_after_pending: number
  available_after_all: number
  price: number
}

type CalculationMethod = "confirmed" | "confirmed_pending" | "all"

export function InventoryAnalysis() {
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [calculationMethod, setCalculationMethod] = useState<CalculationMethod>("confirmed_pending")
  const { toast } = useToast()

  useEffect(() => {
    fetchInventoryData()
  }, [])

  const fetchInventoryData = async () => {
    try {
      const supabase = createClient()

      // Get products
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name, collection, stock, price")
        .order("collection")
        .order("name")

      if (productsError) throw productsError

      // Get confirmed orders
      const { data: confirmedOrders, error: confirmedError } = await supabase
        .from("order_items")
        .select(`
          product_id,
          quantity,
          orders!inner(status)
        `)
        .eq("orders.status", "confirmed")

      if (confirmedError) throw confirmedError

      // Get pending orders
      const { data: pendingOrders, error: pendingError } = await supabase
        .from("order_items")
        .select(`
          product_id,
          quantity,
          orders!inner(status)
        `)
        .eq("orders.status", "pending")

      if (pendingError) throw pendingError

      // Get all orders (confirmed + pending + rejected)
      const { data: allOrders, error: allError } = await supabase.from("order_items").select(`
          product_id,
          quantity,
          orders!inner(status)
        `)

      if (allError) throw allError

      // Process data
      const processedData: InventoryItem[] = products.map((product) => {
        const confirmedQty = confirmedOrders
          .filter((item) => item.product_id === product.id)
          .reduce((sum, item) => sum + item.quantity, 0)

        const pendingQty = pendingOrders
          .filter((item) => item.product_id === product.id)
          .reduce((sum, item) => sum + item.quantity, 0)

        const allQty = allOrders
          .filter((item) => item.product_id === product.id)
          .reduce((sum, item) => sum + item.quantity, 0)

        return {
          id: product.id,
          name: product.name,
          collection: product.collection,
          current_stock: product.stock,
          confirmed_orders: confirmedQty,
          pending_orders: pendingQty,
          all_orders: allQty,
          available_after_confirmed: product.stock - confirmedQty,
          available_after_pending: product.stock - confirmedQty - pendingQty,
          available_after_all: product.stock - allQty,
          price: product.price,
        }
      })

      setInventoryData(processedData)
    } catch (error) {
      console.error("Error fetching inventory data:", error)
      toast({
        title: "שגיאה",
        description: "שגיאה בטעינת נתוני המלאי",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getAvailableStock = (item: InventoryItem) => {
    switch (calculationMethod) {
      case "confirmed":
        return item.available_after_confirmed
      case "confirmed_pending":
        return item.available_after_pending
      case "all":
        return item.available_after_all
      default:
        return item.available_after_confirmed
    }
  }

  const getOrdersCount = (item: InventoryItem) => {
    switch (calculationMethod) {
      case "confirmed":
        return item.confirmed_orders
      case "confirmed_pending":
        return item.confirmed_orders + item.pending_orders
      case "all":
        return item.all_orders
      default:
        return item.confirmed_orders + item.pending_orders
    }
  }

  const getProblematicItems = () => {
    return inventoryData.filter((item) => getAvailableStock(item) < 0)
  }

  const getLowStockItems = () => {
    return inventoryData.filter((item) => {
      const available = getAvailableStock(item)
      return available >= 0 && available <= 2
    })
  }

  const exportToExcel = () => {
    const dataToExport = inventoryData.map((item) => ({
      "שם המוצר": item.name,
      קולקציה: item.collection,
      "מלאי נוכחי": item.current_stock,
      "הזמנות מאושרות": item.confirmed_orders,
      "הזמנות ממתינות": item.pending_orders,
      "סה״כ הזמנות": item.all_orders,
      "זמין אחרי מאושרות": item.available_after_confirmed,
      "זמין אחרי מאושרות+ממתינות": item.available_after_pending,
      "זמין אחרי כל ההזמנות": item.available_after_all,
      "מחיר ליחידה": `₪${item.price}`,
    }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "ניתוח מלאי")

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `ניתוח-מלאי-${new Date().toISOString().split("T")[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "הצלחה",
      description: "קובץ האקסל נוצר ורד בהצלחה",
    })
  }

  const problematicItems = getProblematicItems()
  const lowStockItems = getLowStockItems()

  if (loading) {
    return <div className="flex justify-center p-8">טוען נתוני מלאי...</div>
  }

  return (
    <Tabs defaultValue="analysis" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="analysis">ניתוח מלאי</TabsTrigger>
        <TabsTrigger value="original-stock">ייצוא מלאי מקורי</TabsTrigger>
      </TabsList>

      <TabsContent value="analysis" className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">ניתוח מלאי</h2>
          <div className="flex items-center gap-4">
            <Select value={calculationMethod} onValueChange={(value: CalculationMethod) => setCalculationMethod(value)}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">רק הזמנות מאושרות</SelectItem>
                <SelectItem value="confirmed_pending">מאושרות + ממתינות (מומלץ)</SelectItem>
                <SelectItem value="all">כל ההזמנות</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportToExcel} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              ייצא לאקסל
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">מוצרים בעייתיים</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{problematicItems.length}</div>
              <p className="text-xs text-muted-foreground">מלאי שלילי</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">מלאי נמוך</CardTitle>
              <TrendingDown className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</div>
              <p className="text-xs text-muted-foreground">0-2 יחידות</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">סה״כ מוצרים</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventoryData.length}</div>
              <p className="text-xs text-muted-foreground">במערכת</p>
            </CardContent>
          </Card>
        </div>

        {/* Method Explanation */}
        <Card>
          <CardHeader>
            <CardTitle>הסבר שיטות חישוב</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 border rounded">
                <h4 className="font-medium mb-2">רק הזמנות מאושרות</h4>
                <p className="text-muted-foreground">
                  מציג את המלאי הזמין אחרי הזמנות שכבר אושרו. מתאים לבדיקת מצב המלאי הנוכחי.
                </p>
              </div>
              <div className="p-3 border rounded bg-blue-50">
                <h4 className="font-medium mb-2">מאושרות + ממתינות (מומלץ)</h4>
                <p className="text-muted-foreground">
                  כולל גם הזמנות ממתינות לאישור. מתאים לתכנון ובדיקת זמינות עתידית.
                </p>
              </div>
              <div className="p-3 border rounded">
                <h4 className="font-medium mb-2">כל ההזמנות</h4>
                <p className="text-muted-foreground">כולל גם הזמנות שנדחו. מתאים לניתוח היסטורי של הביקוש.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Problematic Items */}
        {problematicItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">מוצרים בעייתיים - מלאי שלילי</CardTitle>
              <CardDescription>מוצרים שההזמנות עליהם עולות על המלאי הזמין</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {problematicItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 border rounded bg-red-50">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.collection}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">מלאי: {item.current_stock}</Badge>
                      <p className="text-sm mt-1">הזמנות: {getOrdersCount(item)}</p>
                      <p className="text-sm font-medium text-red-600">חסר: {Math.abs(getAvailableStock(item))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Low Stock Items */}
        {lowStockItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-yellow-600">מלאי נמוך</CardTitle>
              <CardDescription>מוצרים עם מלאי זמין של 0-2 יחידות</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 border rounded bg-yellow-50">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.collection}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">זמין: {getAvailableStock(item)}</Badge>
                      <p className="text-sm mt-1">מלאי: {item.current_stock}</p>
                      <p className="text-sm">הזמנות: {getOrdersCount(item)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>כל המוצרים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-2">מוצר</th>
                    <th className="text-right p-2">קולקציה</th>
                    <th className="text-right p-2">מלאי נוכחי</th>
                    <th className="text-right p-2">הזמנות</th>
                    <th className="text-right p-2">זמין</th>
                    <th className="text-right p-2">מחיר</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData.map((item) => {
                    const available = getAvailableStock(item)
                    const orders = getOrdersCount(item)
                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{item.name}</td>
                        <td className="p-2 text-muted-foreground">{item.collection}</td>
                        <td className="p-2">{item.current_stock}</td>
                        <td className="p-2">{orders}</td>
                        <td className="p-2">
                          <span
                            className={
                              available < 0 ? "text-red-600 font-medium" : available <= 2 ? "text-yellow-600" : ""
                            }
                          >
                            {available}
                          </span>
                        </td>
                        <td className="p-2">₪{item.price}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="original-stock">
        <OriginalStockExporter />
      </TabsContent>
    </Tabs>
  )
}

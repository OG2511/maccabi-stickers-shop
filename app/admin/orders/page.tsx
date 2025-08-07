"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, Download, Eye, AlertCircle } from 'lucide-react'
import Link from "next/link"
import { DeleteOrderButton } from "./delete-order-button"
import { CancelOrderButton } from "./cancel-order-button"
import { ConfirmOrderButton } from "./confirm-order-button"
import { RejectOrderButton } from "./reject-order-button"
import { EditOrderDialog } from "./edit-order-dialog"
import * as XLSX from "xlsx"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Product {
  id: string
  name: string
  price: number
  image_url?: string
  stock: number
  collection: string
}

interface OrderItem {
  id: string
  quantity: number
  price_per_item: number
  products: Product
}

interface Order {
  id: string
  customer_name: string
  phone: string
  delivery_option: "self_pickup" | "israel_post"
  payment_method: "bit" | "paypal" | "paybox"
  city?: string
  street?: string
  house_number?: string
  zip_code?: string
  total_price: number
  status: "pending" | "confirmed" | "rejected" | "cancelled"
  created_at: string
  order_items: OrderItem[]
}

const statusColors: { [key: string]: string } = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
}

const statusLabels: { [key: string]: string } = {
  pending: "ממתין",
  confirmed: "מאושר",
  rejected: "נדחה",
  cancelled: "בוטל",
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/admin/orders")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to fetch orders")
      }

      const data = await response.json()
      setOrders(data)
    } catch (err) {
      console.error("❌ Failed to fetch orders:", err)
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
      setError(`שגיאה בטעינת ההזמנות: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const filterOrders = useCallback(() => {
    let filtered = [...orders]

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.customer_name.toLowerCase().includes(lowercasedFilter) ||
          order.phone.includes(searchTerm) ||
          order.id.toLowerCase().includes(lowercasedFilter)
      )
    }

    setFilteredOrders(filtered)
  }, [orders, statusFilter, searchTerm])

  useEffect(() => {
    filterOrders()
  }, [orders, statusFilter, searchTerm, filterOrders])

  const handleOrderUpdate = () => {
    fetchOrders()
  }

  const exportToExcel = () => {
    const exportData = filteredOrders.map((order) => ({
      "מזהה הזמנה": order.id,
      "שם לקוח": order.customer_name,
      טלפון: order.phone,
      "אופן משלוח": order.delivery_option === "self_pickup" ? "איסוף עצמי" : "דואר ישראל",
      "אמצעי תשלום": order.payment_method,
      עיר: order.city || "",
      רחוב: order.street || "",
      "מספר בית": order.house_number || "",
      מיקוד: order.zip_code || "",
      "מחיר כולל": order.total_price,
      סטטוס: statusLabels[order.status],
      "תאריך יצירה": new Date(order.created_at).toLocaleDateString("he-IL"),
      מוצרים: order.order_items.map((item) => `${item.products.name} (כמות: ${item.quantity})`).join(", "),
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "הזמנות")
    XLSX.writeFile(wb, `הזמנות_${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <LoadingSpinner size={48} />
          <p className="mt-4 text-lg">טוען הזמנות...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">ניהול הזמנות</h1>
        <Button onClick={exportToExcel} disabled={filteredOrders.length === 0}>
          <Download className="ml-2 h-4 w-4" />
          ייצא לאקסל
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="חפש לפי שם, טלפון או מזהה הזמנה..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="סנן לפי סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="pending">ממתין</SelectItem>
            <SelectItem value="confirmed">מאושר</SelectItem>
            <SelectItem value="rejected">נדחה</SelectItem>
            <SelectItem value="cancelled">בוטל</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>שגיאה</AlertTitle>
          <AlertDescription>
            {error}
            <Button onClick={fetchOrders} variant="link" className="p-0 h-auto ml-2">
              נסה שוב
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {filteredOrders.length === 0 && !loading ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <p>לא נמצאו הזמנות התואמות לחיפוש.</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {order.customer_name} - ₪{order.total_price.toFixed(2)}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {order.phone} • {new Date(order.created_at).toLocaleString("he-IL")}
                    </p>
                  </div>
                  <Badge variant="outline" className={`${statusColors[order.status]} whitespace-nowrap`}>
                    {statusLabels[order.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="font-medium">פרטי משלוח ותשלום:</p>
                    <p className="text-sm">
                      <strong>אופן משלוח:</strong>{" "}
                      {order.delivery_option === "self_pickup" ? "איסוף עצמי" : "דואר ישראל"}
                    </p>
                    {order.delivery_option === "israel_post" && order.city && (
                      <p className="text-sm">
                        <strong>כתובת:</strong> {order.street} {order.house_number}, {order.city}, {order.zip_code}
                      </p>
                    )}
                    <p className="text-sm">
                      <strong>אמצעי תשלום:</strong> {order.payment_method}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">מוצרים:</p>
                    <ul className="text-sm list-disc pr-4">
                      {order.order_items.map((item) => (
                        <li key={item.id}>
                          {item.products.name} × {item.quantity} (₪{item.price_per_item.toFixed(2)} ליחידה)
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap items-center border-t pt-4 mt-4">
                  <Link href={`/admin/orders/${order.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="ml-1 h-4 w-4" />
                      צפה בפרטים
                    </Button>
                  </Link>

                  {order.status !== "rejected" && order.id && (
                    <EditOrderDialog order={order} onOrderUpdated={handleOrderUpdate} />
                  )}

                  {order.status === "pending" && order.id && (
                    <>
                      <ConfirmOrderButton orderId={order.id} onSuccess={handleOrderUpdate} />
                      <RejectOrderButton orderId={order.id} onSuccess={handleOrderUpdate} />
                    </>
                  )}

                  {order.id && (
                    <CancelOrderButton orderId={order.id} orderStatus={order.status} onSuccess={handleOrderUpdate} />
                  )}
                  
                  {order.id && (
                    <DeleteOrderButton orderId={order.id} onSuccess={handleOrderUpdate} />
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

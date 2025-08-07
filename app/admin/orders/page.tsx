"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, Download, Eye } from "lucide-react"
import Link from "next/link"
import { DeleteOrderButton } from "./delete-order-button"
import { CancelOrderButton } from "./cancel-order-button"
import { ConfirmOrderButton } from "./confirm-order-button"
import { RejectOrderButton } from "./reject-order-button"
import { EditOrderDialog } from "./edit-order-dialog"
import * as XLSX from "xlsx"

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

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
}

const statusLabels = {
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

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, statusFilter, searchTerm])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      // Set a cookie for development testing
      if (process.env.NODE_ENV === "development") {
        document.cookie = "admin_authenticated=true; path=/"
      }

      const response = await fetch("/api/admin/orders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for cookies
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch orders")
      }

      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error("❌ Failed to fetch orders:", error)
      setError(error instanceof Error ? error.message : "שגיאה בטעינת ההזמנות")
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = orders

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.phone.includes(searchTerm) ||
          order.id.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredOrders(filtered)
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
      מוצרים: order.order_items.map((item) => `${item.products.name} (${item.quantity})`).join(", "),
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "הזמנות")

    // Create blob and download
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const blob = new Blob([wbout], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `הזמנות_${new Date().toISOString().split("T")[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <LoadingSpinner className="mb-4" />
          <p className="text-center">טוען הזמנות...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600 text-center mb-4">{error}</p>
            <Button onClick={fetchOrders} className="mx-auto block">
              נסה שוב
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">ניהול הזמנות</h1>
        <Button onClick={exportToExcel} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          ייצא לאקסל
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="חפש לפי שם, טלפון או מזהה הזמנה..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
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

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">לא נמצאו הזמנות</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {order.customer_name} - ₪{order.total_price}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {order.phone} • {new Date(order.created_at).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                  <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm">
                      <strong>אופן משלוח:</strong>{" "}
                      {order.delivery_option === "self_pickup" ? "איסוף עצמי" : "דואר ישראל"}
                    </p>
                    <p className="text-sm">
                      <strong>אמצעי תשלום:</strong> {order.payment_method}
                    </p>
                    {order.city && (
                      <p className="text-sm">
                        <strong>כתובת:</strong> {order.street} {order.house_number}, {order.city} {order.zip_code}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm">
                      <strong>מוצרים:</strong>
                    </p>
                    <ul className="text-sm text-gray-600">
                      {order.order_items.map((item) => (
                        <li key={item.id}>
                          {item.products.name} × {item.quantity} (₪{item.price_per_item} כל אחד)
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Link href={`/admin/orders/${order.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      צפה
                    </Button>
                  </Link>

                  {/* Edit Order Button - Available for all orders except rejected */}
                  {order.status !== "rejected" && <EditOrderDialog order={order} onOrderUpdated={fetchOrders} />}

                  {order.status === "pending" && (
                    <>
                      <ConfirmOrderButton orderId={order.id} />
                      <RejectOrderButton orderId={order.id} />
                    </>
                  )}

                  <CancelOrderButton orderId={order.id} orderStatus={order.status} />

                  <DeleteOrderButton orderId={order.id} />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

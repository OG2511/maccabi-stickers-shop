"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/hooks/use-supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmOrderButton } from "./confirm-order-button"
import { RejectOrderButton } from "./reject-order-button"
import { DeleteOrderButton } from "./delete-order-button"
import { BulkDeleteButton } from "./bulk-delete-button"
import { AdminNotifications } from "@/components/admin-notifications"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Settings } from "lucide-react"

interface Order {
  id: string
  created_at: string
  customer_name: string
  delivery_option: string
  total_price: number
  status: string
  order_items: Array<{
    quantity: number
    products: {
      name: string
      price: number
    }
  }>
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = useSupabase() // Moved useSupabase hook to the top level

  const loadOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          quantity,
          products (
            name,
            price
          )
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading orders:", error)
      toast({
        title: "שגיאה",
        description: "שגיאה בטעינת ההזמנות",
        variant: "destructive",
      })
    } else {
      setOrders(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    // Handle success/error messages
    const success = searchParams.get("success")
    const error = searchParams.get("error")

    if (success === "deleted") {
      toast({
        title: "הצלחה",
        description: "ההזמנה נמחקה בהצלחה",
      })
      // Clear the URL params
      router.replace("/admin/orders")
    }

    if (success === "bulk-deleted") {
      const count = searchParams.get("count")
      toast({
        title: "הצלחה",
        description: `${count} הזמנות נמחקו בהצלחה`,
      })
      router.replace("/admin/orders")
    }

    if (error === "delete-failed") {
      toast({
        title: "שגיאה",
        description: "שגיאה במחיקת ההזמנה",
        variant: "destructive",
      })
      router.replace("/admin/orders")
    }
  }, [searchParams, router, toast])

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    const newSelected = new Set(selectedOrders)
    if (checked) {
      newSelected.add(orderId)
    } else {
      newSelected.delete(orderId)
    }
    setSelectedOrders(newSelected)
    setSelectAll(newSelected.size === orders.length && orders.length > 0)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(new Set(orders.map((order) => order.id)))
    } else {
      setSelectedOrders(new Set())
    }
    setSelectAll(checked)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="default">מאושרת</Badge>
      case "rejected":
        return <Badge variant="destructive">נדחתה</Badge>
      default:
        return <Badge variant="secondary">ממתינה</Badge>
    }
  }

  const handleOrderUpdate = () => {
    // Refresh orders after update
    loadOrders()
    // Clear selections
    setSelectedOrders(new Set())
    setSelectAll(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">טוען הזמנות...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">ניהול הזמנות</h1>
        <div className="flex items-center gap-4">
          <AdminNotifications />
          <Button asChild variant="outline">
            <Link href="/admin/settings">
              <Settings className="h-4 w-4 mr-2" />
              הגדרות
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/products">ניהול מוצרים</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/users">ניהול זמן אמת</Link>
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.size > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-blue-700 font-medium">{selectedOrders.size} הזמנות נבחרו</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedOrders(new Set())
                  setSelectAll(false)
                }}
              >
                בטל בחירה
              </Button>
              <BulkDeleteButton selectedOrders={selectedOrders} onSuccess={handleOrderUpdate} />
            </div>
          </div>
        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
              </TableHead>
              <TableHead>תאריך</TableHead>
              <TableHead>לקוח</TableHead>
              <TableHead>משלוח</TableHead>
              <TableHead>סה"כ</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>פעולות</TableHead>
              <TableHead>פרטים</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  אין הזמנות להצגה
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedOrders.has(order.id)}
                      onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString("he-IL")}</TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>{order.delivery_option === "israel_post" ? "דואר" : "איסוף"}</TableCell>
                  <TableCell>₪{order.total_price}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {order.status === "pending" && (
                        <>
                          <ConfirmOrderButton orderId={order.id} onSuccess={handleOrderUpdate} />
                          <RejectOrderButton orderId={order.id} onSuccess={handleOrderUpdate} />
                        </>
                      )}
                      <DeleteOrderButton
                        orderId={order.id}
                        orderNumber={order.id.slice(-8)}
                        onSuccess={handleOrderUpdate}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/orders/${order.id}`}>פרטים</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        סה"כ הזמנות: {orders.length} | נטען ב-{new Date().toLocaleTimeString("he-IL")}
      </div>
    </div>
  )
}

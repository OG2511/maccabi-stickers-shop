import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export const revalidate = 0

interface OrderDetailsPageProps {
  params: { orderId: string }
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const supabase = createClient()

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        quantity,
        price_per_item,
        products (
          name,
          image_url
        )
      )
    `)
    .eq("id", params.orderId)
    .single()

  if (error || !order) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <Card>
          <CardContent className="text-center py-8">
            <h1 className="text-2xl font-bold mb-2">הזמנה לא נמצאה</h1>
            <p className="text-muted-foreground mb-4">מספר ההזמנה שהזנת אינו תקין</p>
            <Button asChild>
              <Link href="/admin/orders">חזרה לרשימת הזמנות</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "מאושרת"
      case "rejected":
        return "נדחתה"
      default:
        return "ממתינה לאישור"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default"
      case "rejected":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/orders">
            <ArrowRight className="h-4 w-4 ml-2" />
            חזרה לרשימת הזמנות
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              הזמנה #{order.id.slice(-8)}
              <Badge variant={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">תאריך:</span>
                <p className="font-medium">{new Date(order.created_at).toLocaleDateString("he-IL")}</p>
              </div>
              <div>
                <span className="text-muted-foreground">שם:</span>
                <p className="font-medium">{order.customer_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">טלפון:</span>
                <p className="font-medium">{order.phone}</p>
              </div>
              <div>
                <span className="text-muted-foreground">משלוח:</span>
                <p className="font-medium">{order.delivery_option === "israel_post" ? "דואר ישראל" : "איסוף עצמי"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">תשלום:</span>
                <p className="font-medium">{order.payment_method === "bit" ? "Bit" : "PayPal"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">סה"כ:</span>
                <p className="font-medium text-lg">₪{order.total_price}</p>
              </div>
            </div>

            {order.delivery_option === "israel_post" && (
              <div className="pt-4 border-t">
                <span className="text-muted-foreground">כתובת משלוח:</span>
                <p className="font-medium">
                  {order.street} {order.house_number}, {order.city}
                  {order.zip_code && `, ${order.zip_code}`}
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <span className="text-muted-foreground">קישור מעקב ללקוח:</span>
              <p className="font-medium">
                <Link href={`/order-status/${order.id}`} className="text-blue-600 hover:underline" target="_blank">
                  /order-status/{order.id.slice(-8)}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>פריטים בהזמנה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.order_items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted rounded">
                  <div>
                    <p className="font-medium">{item.products?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      כמות: {item.quantity} × ₪{item.price_per_item}
                    </p>
                  </div>
                  <p className="font-semibold">₪{item.quantity * item.price_per_item}</p>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 mt-3 flex justify-between font-bold text-lg">
              <span>סה"כ:</span>
              <span>₪{order.total_price}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

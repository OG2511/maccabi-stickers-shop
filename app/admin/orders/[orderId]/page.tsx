import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { ConfirmOrderButton } from "../confirm-order-button"
import { RejectOrderButton } from "../reject-order-button"
import { DeleteOrderButton } from "../delete-order-button"
import { CancelOrderButton } from "../cancel-order-button"
import { EditOrderDialog } from "../edit-order-dialog"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface OrderDetails {
  id: string
  customer_name: string
  phone: string
  delivery_option: "self_pickup" | "israel_post"
  city: string | null
  street: string | null
  house_number: string | null
  zip_code: string | null
  total_price: number
  status: "pending" | "confirmed" | "shipped" | "rejected" | "cancelled"
  payment_method: "bit" | "paypal" | "paybox"
  created_at: string
  order_items: Array<{
    id: string
    quantity: number
    price_per_item: number
    products: {
      id: string
      name: string
      collection: string
      image_url: string | null
    }
  }>
}

function getStatusBadge(status: string) {
  const statusMap = {
    pending: { label: "ממתין", variant: "secondary" as const },
    confirmed: { label: "מאושר", variant: "default" as const },
    shipped: { label: "נשלח", variant: "success" as const },
    rejected: { label: "נדחה", variant: "destructive" as const },
    cancelled: { label: "בוטל", variant: "outline" as const },
  }

  const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

function getDeliveryLabel(delivery: string) {
  return delivery === "self_pickup" ? "איסוף עצמי" : "דואר ישראל"
}

function getPaymentLabel(payment: string) {
  const paymentMap = {
    bit: "Bit",
    paypal: "PayPal",
    paybox: "PayBox",
  }
  return paymentMap[payment as keyof typeof paymentMap] || payment
}

export default async function OrderDetailsPage({
  params,
}: {
  params: { orderId: string }
}) {
  const supabase = createClient()

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        id,
        quantity,
        price_per_item,
        products (
          id,
          name,
          collection,
          image_url
        )
      )
    `)
    .eq("id", params.orderId)
    .single()

  if (error || !order) {
    notFound()
  }

  const orderDetails = order as OrderDetails

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/orders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            חזור להזמנות
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">פרטי הזמנה #{orderDetails.id.slice(0, 8)}</h1>
        {getStatusBadge(orderDetails.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>פרטי לקוח</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <strong>שם:</strong> {orderDetails.customer_name}
            </p>
            <p>
              <strong>טלפון:</strong> {orderDetails.phone}
            </p>
            <p>
              <strong>אמצעי תשלום:</strong> {getPaymentLabel(orderDetails.payment_method)}
            </p>
            <p>
              <strong>תאריך הזמנה:</strong> {new Date(orderDetails.created_at).toLocaleDateString("he-IL")}
            </p>
          </CardContent>
        </Card>

        {/* Delivery Information */}
        <Card>
          <CardHeader>
            <CardTitle>פרטי משלוח</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <strong>אופן משלוח:</strong> {getDeliveryLabel(orderDetails.delivery_option)}
            </p>
            {orderDetails.delivery_option === "israel_post" && (
              <>
                <p>
                  <strong>עיר:</strong> {orderDetails.city}
                </p>
                <p>
                  <strong>רחוב:</strong> {orderDetails.street}
                </p>
                <p>
                  <strong>מספר בית:</strong> {orderDetails.house_number}
                </p>
                <p>
                  <strong>מיקוד:</strong> {orderDetails.zip_code}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>פריטי הזמנה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orderDetails.order_items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <img
                  src={item.products.image_url || "/placeholder.svg?width=80&height=80"}
                  alt={item.products.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{item.products.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.products.collection}</p>
                  <p className="text-sm">כמות: {item.quantity}</p>
                </div>
                <div className="text-left">
                  <p className="font-semibold">{formatCurrency(item.price_per_item)}</p>
                  <p className="text-sm text-muted-foreground">
                    סה"כ: {formatCurrency(item.quantity * item.price_per_item)}
                  </p>
                </div>
              </div>
            ))}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>סכום כולל:</span>
                <span>{formatCurrency(orderDetails.total_price)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>פעולות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <EditOrderDialog order={orderDetails} />

            {orderDetails.status === "pending" && (
              <>
                <ConfirmOrderButton orderId={orderDetails.id} />
                <RejectOrderButton orderId={orderDetails.id} />
              </>
            )}

            <CancelOrderButton orderId={orderDetails.id} orderStatus={orderDetails.status} />
            <DeleteOrderButton orderId={orderDetails.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle, Clock, XCircle, RefreshCw, CreditCard, Phone } from "lucide-react"

export const revalidate = 0
export const dynamic = "force-dynamic"

interface OrderStatusPageProps {
  params: { orderId: string }
}

export default async function OrderStatusPage({ params }: OrderStatusPageProps) {
  console.log("🟢 Loading order status page for ID:", params.orderId)

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

  if (error) {
    console.error("🔴 Error loading order:", error)
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <Card>
          <CardContent className="text-center py-8">
            <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">הזמנה לא נמצאה</h1>
            <p className="text-muted-foreground mb-4">מספר ההזמנה שהזנת אינו תקין</p>
            <Button asChild>
              <Link href="/">חזרה לעמוד הבית</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!order) {
    console.error("🔴 Order not found")
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <Card>
          <CardContent className="text-center py-8">
            <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">הזמנה לא נמצאה</h1>
            <p className="text-muted-foreground mb-4">מספר ההזמנה שהזנת אינו תקין</p>
            <Button asChild>
              <Link href="/">חזרה לעמוד הבית</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  console.log("✅ Order loaded successfully:", order.id)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "rejected":
        return <XCircle className="h-6 w-6 text-red-500" />
      default:
        return <Clock className="h-6 w-6 text-yellow-500" />
    }
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

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "bit":
        return "Bit"
      case "paypal":
        return "PayPal"
      case "paybox":
        return "PayBox"
      default:
        return method
    }
  }

  const getPaymentLink = (method: string) => {
    const links = {
      bit: "https://www.bitpay.co.il/app/me/7311FA79-2833-EEC3-FE43-64405D38134AD5A9",
      paypal: "https://www.paypal.me/orellgabay",
      paybox: "https://link.payboxapp.com/ust85raDgoBTQhZU9",
    }
    return links[method as keyof typeof links]
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">{getStatusIcon(order.status)}</div>
          <CardTitle className="text-2xl">מעקב הזמנה #{order.id.slice(-8)}</CardTitle>
          <Badge variant={getStatusColor(order.status)} className="w-fit mx-auto">
            {getStatusText(order.status)}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Status Message */}
          <div className="text-center p-4 rounded-lg bg-muted">
            {order.status === "pending" && (
              <div>
                <h3 className="font-semibold text-lg mb-2">ההזמנה שלך נשלחה!</h3>
                <p className="text-muted-foreground mb-4">אנחנו בודקים את התשלום שלך. תקבל עדכון ברגע שההזמנה תאושר.</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  הדף מתעדכן אוטומטית
                </div>
              </div>
            )}
            {order.status === "confirmed" && (
              <div>
                <h3 className="font-semibold text-lg mb-2 text-green-600">ההזמנה אושרה!</h3>
                <p className="text-muted-foreground">התשלום התקבל בהצלחה. ההזמנה שלך בהכנה.</p>
              </div>
            )}
            {order.status === "rejected" && (
              <div>
                <h3 className="font-semibold text-lg mb-2 text-red-600">ההזמנה נדחתה</h3>
                <p className="text-muted-foreground">התשלום לא התקבל או שיש בעיה עם ההזמנה. אנא צור קשר לפרטים.</p>
              </div>
            )}
          </div>

          {/* Payment Information */}
          {order.status === "pending" && (
            <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-primary">פרטי תשלום</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>סכום לתשלום:</strong>{" "}
                  <span className="text-lg font-bold text-primary">₪{order.total_price}</span>
                </p>
                <p>
                  <strong>אמצעי תשלום:</strong> {getPaymentMethodText(order.payment_method)}
                </p>
                <div className="mt-4">
                  <Button asChild className="w-full">
                    <Link href={getPaymentLink(order.payment_method)} target="_blank" rel="noopener noreferrer">
                      שלם עכשיו עם {getPaymentMethodText(order.payment_method)}
                    </Link>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  לחץ על הכפתור למעלה כדי לבצע את התשלום. לאחר התשלום, הדף יתעדכן אוטומטית.
                </p>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="p-4 border rounded-lg bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold text-blue-600">יש שאלות?</h4>
            </div>
            <p className="text-sm text-blue-700">ניתן ללחוץ על כפתור הווטסאפ לקבלת עדכונים ועזרה בביצוע ההזמנה</p>
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            <h3 className="font-semibold">פרטי ההזמנה:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
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
                <span className="text-muted-foreground">תאריך:</span>
                <p className="font-medium">{new Date(order.created_at).toLocaleDateString("he-IL")}</p>
              </div>
            </div>

            {order.delivery_option === "israel_post" && (
              <div>
                <span className="text-muted-foreground">כתובת משלוח:</span>
                <p className="font-medium">
                  {order.street} {order.house_number}, {order.city}
                  {order.zip_code && `, ${order.zip_code}`}
                </p>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="space-y-4">
            <h3 className="font-semibold">פריטים בהזמנה:</h3>
            <div className="space-y-2">
              {order.order_items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
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
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>סה"כ:</span>
              <span>₪{order.total_price}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button asChild variant="outline" className="flex-1 bg-transparent">
              <Link href="/shop">המשך קניות</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/">חזרה לעמוד הבית</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Auto-refresh script for pending orders */}
      {order.status === "pending" && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log("🔄 Auto-refresh enabled for pending order");
              setTimeout(() => {
                console.log("🔄 Refreshing page...");
                window.location.reload();
              }, 15000); // Refresh every 15 seconds
            `,
          }}
        />
      )}
    </div>
  )
}

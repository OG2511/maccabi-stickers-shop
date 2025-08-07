"use client"

import type React from "react"

import { useState } from "react"
import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { submitOrder } from "@/lib/actions"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"
import Image from "next/image"

type DeliveryOption = "self_pickup" | "israel_post"
type PaymentMethod = "bit" | "paypal" | "paybox"

const PAYMENT_LINKS = {
  bit: "https://www.bitpay.co.il/app/me/7311FA79-2833-EEC3-FE43-64405D38134AD5A9",
  paypal: "https://www.paypal.me/orellgabay",
  paybox: "https://link.payboxapp.com/ust85raDgoBTQhZU9",
}

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart } = useCart()
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("self_pickup")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bit")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const finalPrice = deliveryOption === "israel_post" ? totalPrice + 15 : totalPrice

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)

    // Add user agent for mobile detection
    formData.append("userAgent", navigator.userAgent)

    console.log("📱 Submitting order from:", {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      userAgent: navigator.userAgent.substring(0, 50) + "...",
    })

    const result = await submitOrder(formData, cart, finalPrice)

    if (result.success) {
      console.log("✅ Order submitted successfully, Order ID:", result.orderId)

      toast({
        title: "ההזמנה נשלחה!",
        description: "מיד תועבר לתשלום.",
      })
      clearCart()

      // Get payment URL
      const paymentUrl = PAYMENT_LINKS[paymentMethod]
      console.log("🔗 Opening payment URL:", paymentUrl)

      // Always redirect to status page first, then open payment
      router.push(`/order-status/${result.orderId}`)

      // Small delay then open payment
      setTimeout(() => {
        try {
          window.open(paymentUrl, "_blank", "noopener,noreferrer")
        } catch (error) {
          console.error("Error opening payment window:", error)
        }
      }, 1000)
    } else {
      console.error("❌ Order submission failed:", result.error)
      toast({
        title: "שגיאה",
        description: result.error || "אירעה שגיאה בשליחת ההזמנה.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="container mx-auto text-center py-20">
        <h1 className="text-2xl">סל הקניות שלך ריק.</h1>
        <Button asChild variant="link" onClick={() => router.push("/shop")}>
          חזרה לחנות
        </Button>
      </div>
    )
  }

  const getPaymentMethodText = (method: PaymentMethod) => {
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

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle>פרטי משלוח</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">שם מלא</Label>
                <Input id="fullName" name="fullName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">טלפון</Label>
                <Input id="phone" name="phone" type="tel" required />
              </div>
              <RadioGroup
                name="deliveryOption"
                value={deliveryOption}
                onValueChange={(value: DeliveryOption) => setDeliveryOption(value)}
                className="space-y-2"
              >
                <Label>אפשרויות משלוח</Label>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="self_pickup" id="self_pickup" />
                  <Label htmlFor="self_pickup">איסוף עצמי (חינם)</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="israel_post" id="israel_post" />
                  <Label htmlFor="israel_post">דואר ישראל (15 ₪)</Label>
                </div>
              </RadioGroup>
              {deliveryOption === "israel_post" && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">עיר</Label>
                      <Input id="city" name="city" required={deliveryOption === "israel_post"} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="street">רחוב</Label>
                      <Input id="street" name="street" required={deliveryOption === "israel_post"} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="houseNumber">מספר בית</Label>
                      <Input id="houseNumber" name="houseNumber" required={deliveryOption === "israel_post"} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">מיקוד</Label>
                      <Input id="zipCode" name="zipCode" required={deliveryOption === "israel_post"} />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Summary & Payment */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>סיכום הזמנה</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span>
                      {item.product.name} x {item.quantity}
                    </span>
                    <span>₪{item.product.price * item.quantity}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 flex justify-between text-sm">
                  <span>מחיר מוצרים</span>
                  <span>₪{totalPrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>משלוח</span>
                  <span>{deliveryOption === "israel_post" ? "₪15" : "חינם"}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                  <span>סה"כ לתשלום</span>
                  <span>₪{finalPrice}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>אמצעי תשלום</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  name="paymentMethod"
                  value={paymentMethod}
                  onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                  {/* Bit Payment Option */}
                  <div className="relative">
                    <RadioGroupItem value="bit" id="bit" className="sr-only" />
                    <Label
                      htmlFor="bit"
                      className={`cursor-pointer border-2 rounded-lg p-4 flex items-center justify-center relative transition-all duration-200 ${
                        paymentMethod === "bit"
                          ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-2"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <Image src="/bit-logo.png" alt="Bit" width={80} height={80} />
                      {paymentMethod === "bit" && (
                        <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </Label>
                    {paymentMethod === "bit" && (
                      <div className="text-center mt-2">
                        <span className="text-sm font-medium text-primary">✓ נבחר</span>
                      </div>
                    )}
                  </div>

                  {/* PayPal Payment Option */}
                  <div className="relative">
                    <RadioGroupItem value="paypal" id="paypal" className="sr-only" />
                    <Label
                      htmlFor="paypal"
                      className={`cursor-pointer border-2 rounded-lg p-4 flex items-center justify-center relative transition-all duration-200 ${
                        paymentMethod === "paypal"
                          ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-2"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <Image src="/paypal-logo.png" alt="PayPal" width={80} height={80} />
                      {paymentMethod === "paypal" && (
                        <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </Label>
                    {paymentMethod === "paypal" && (
                      <div className="text-center mt-2">
                        <span className="text-sm font-medium text-primary">✓ נבחר</span>
                      </div>
                    )}
                  </div>

                  {/* PayBox Payment Option */}
                  <div className="relative">
                    <RadioGroupItem value="paybox" id="paybox" className="sr-only" />
                    <Label
                      htmlFor="paybox"
                      className={`cursor-pointer border-2 rounded-lg p-4 flex items-center justify-center relative transition-all duration-200 ${
                        paymentMethod === "paybox"
                          ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-2"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <Image src="/paybox-logo.jpg" alt="PayBox" width={80} height={80} />
                      {paymentMethod === "paybox" && (
                        <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </Label>
                    {paymentMethod === "paybox" && (
                      <div className="text-center mt-2">
                        <span className="text-sm font-medium text-primary">✓ נבחר</span>
                      </div>
                    )}
                  </div>
                </RadioGroup>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "שולח הזמנה..." : `שלם עם ${getPaymentMethodText(paymentMethod)}`}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

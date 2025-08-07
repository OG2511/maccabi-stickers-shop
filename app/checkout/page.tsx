"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/components/ui/use-toast"
import { submitOrder } from "@/lib/actions"
import Image from "next/image"
import { Loader2, CreditCard, Truck, MapPin, Gift, CheckCircle, Calculator } from 'lucide-react'
import {
  getCheckoutFields,
  validateOrderAgainstStock,
  canAddSpecialItem,
  calculateTotal
} from "@/lib/cart-rules"


type DeliveryOption = "self_pickup" | "israel_post"
type PaymentMethod = "bit" | "paypal" | "paybox"

const PAYMENT_LINKS = {
  bit: "https://www.bitpay.co.il/app/me/7311FA79-2833-EEC3-FE43-64405D38134AD5A9",
  paypal: "https://www.paypal.me/orellgabay",
  paybox: "https://link.payboxapp.com/ust85raDgoBTQhZU9",
}

export default function CheckoutPage() {
  const { cart, totalItems, clearCart, getDiscountInfo } = useCart()
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("self_pickup")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bit")

  const discountInfo = getDiscountInfo()
  const shippingCost = deliveryOption === "israel_post" ? 15 : 0
  const finalTotalPrice = Math.ceil(discountInfo.finalPrice) + shippingCost

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0) {
      router.push("/shop")
    }
  }, [cart.length, router])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    
    try {
      console.log("🟢 Starting form submission...")
      
      const formData = new FormData(event.currentTarget)
      
      // Validate required fields
      const fullName = formData.get("fullName") as string
      const phone = formData.get("phone") as string
      
      if (!fullName || !phone) {
        toast({
          title: "שדות חובה חסרים",
          description: "אנא מלא את כל השדות הנדרשים",
          variant: "destructive",
        })
        return
      }

      // Validate delivery address if needed
      if (deliveryOption === "israel_post") {
        const city = formData.get("city") as string
        const street = formData.get("street") as string
        
        if (!city || !street) {
          toast({
            title: "כתובת משלוח חסרה",
            description: "אנא מלא את כתובת המשלוח",
            variant: "destructive",
          })
          return
        }
      }
      
      // Add delivery option and payment method to form data
      formData.append("deliveryOption", deliveryOption)
      formData.append("paymentMethod", paymentMethod)
      formData.append("userAgent", navigator.userAgent)
      
      console.log("🟢 Form data prepared:", {
        fullName,
        phone: phone.substring(0, 3) + "***",
        deliveryOption,
        paymentMethod,
        cartItems: cart.length,
        totalPrice: finalTotalPrice
      })
      
      const result = await submitOrder(formData, cart, finalTotalPrice)
      
      console.log("🟢 Submit order result:", result)
      
      if (result.success) {
        clearCart()
        toast({
          title: "ההזמנה נשלחה בהצלחה!",
          description: "תקבל אישור בהודעת WhatsApp בקרוב.",
        })

        // Get payment URL
        const paymentUrl = PAYMENT_LINKS[paymentMethod]
        
        // Redirect to status page first
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
        console.error("🔴 Order submission failed:", result.error)
        toast({
          title: "שגיאה בשליחת ההזמנה",
          description: result.error || "אנא נסה שוב",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("🔴 Error submitting order:", error)
      toast({
        title: "שגיאה בשליחת ההזמנה",
        description: error instanceof Error ? error.message : "אנא נסה שוב",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (cart.length === 0) {
    return null // Will redirect
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">סיום הזמנה</h1>
      
      <form onSubmit={handleSubmit}>
        {getCheckoutFields(delivery).map((field) => (
          <Input key={field} name={field} placeholder={field} required />
        ))}
</form>
    </div>
  )
}

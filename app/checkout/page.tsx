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
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle>פרטי משלוח</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">שם מלא *</Label>
                <Input 
                  id="fullName" 
                  name="fullName" 
                  required 
                  placeholder="הכנס שם מלא"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">טלפון *</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  type="tel" 
                  required 
                  placeholder="050-1234567"
                />
              </div>

              {/* Delivery Options */}
              <div className="space-y-4">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  אופן קבלה
                </Label>
                <RadioGroup
                  value={deliveryOption}
                  onValueChange={(value: DeliveryOption) => setDeliveryOption(value)}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="self_pickup" id="self_pickup" />
                    <Label htmlFor="self_pickup" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">איסוף עצמי</span>
                        <span className="text-green-600 font-medium">חינם</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        איסוף מהמשרד בתיאום מראש
                      </p>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="israel_post" id="israel_post" />
                    <Label htmlFor="israel_post" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">דואר ישראל</span>
                        <span className="font-medium">₪15</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        משלוח עד הבית תוך 3-5 ימי עסקים
                      </p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Shipping Address - Only show when delivery is selected */}
              {deliveryOption === "israel_post" && (
                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    כתובת למשלוח
                  </Label>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="city">עיר *</Label>
                      <Input 
                        id="city" 
                        name="city" 
                        required={deliveryOption === "israel_post"} 
                        placeholder="תל אביב"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="street">רחוב ומספר בית *</Label>
                      <Input 
                        id="street" 
                        name="street" 
                        placeholder="רחוב הרצל 123"
                        required={deliveryOption === "israel_post"} 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="houseNumber">מספר בית</Label>
                        <Input 
                          id="houseNumber" 
                          name="houseNumber" 
                          placeholder="123" 
                        />
                      </div>
                      <div>
                        <Label htmlFor="zipCode">מיקוד</Label>
                        <Input 
                          id="zipCode" 
                          name="zipCode" 
                          placeholder="1234567" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Summary & Payment */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  סיכום הזמנה
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Discount Information */}
                {discountInfo.discountPercentage > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-sm text-green-800">
                      <p className="font-medium flex items-center gap-1">
                        <Gift className="h-4 w-4" />
                        🎉 חסכת ₪{discountInfo.discountAmount.toFixed(2)}!
                      </p>
                      <p>קיבלת {discountInfo.discountPercentage}% הנחה על {discountInfo.regularQuantity} מדבקות רגילות</p>
                    </div>
                  </div>
                )}

                {/* Detailed Price Breakdown */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm text-blue-800">
                    <p className="font-medium flex items-center gap-1 mb-2">
                      <Calculator className="h-4 w-4" />
                      פירוט מחירים
                    </p>
                    <div className="space-y-1">
                      {discountInfo.regularQuantity > 0 && (
                        <div className="flex justify-between">
                          <span>מדבקות רגילות ({discountInfo.regularQuantity}):</span>
                          <span>₪{discountInfo.regularPrice.toFixed(2)}</span>
                        </div>
                      )}
                      {discountInfo.specialQuantity > 0 && (
                        <div className="flex justify-between">
                          <span>מדבקות מיוחדות ({discountInfo.specialQuantity}):</span>
                          <span>₪{discountInfo.specialPrice.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cart Items */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {cart.map((item) => {
                    const isSpecial = item.product.collection === "מיוחדים"
                    const itemPrice = isSpecial 
                      ? item.product.price 
                      : discountInfo.discountPercentage > 0 
                        ? item.product.price * (1 - discountInfo.discountPercentage / 100)
                        : item.product.price
                    
                    return (
                      <div key={item.product.id} className="flex items-center gap-3 text-sm">
                        <Image
                          src={item.product.image_url || "/placeholder.svg?width=40&height=40"}
                          alt={item.product.name}
                          width={40}
                          height={40}
                          className="rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.product.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-500">{item.product.collection}</p>
                            {isSpecial && (
                              <span className="text-xs bg-amber-100 text-amber-800 px-1 py-0.5 rounded">
                                מיוחד
                              </span>
                            )}
                            {!isSpecial && discountInfo.discountPercentage > 0 && (
                              <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                                -{discountInfo.discountPercentage}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-left">
                          <p>x{item.quantity}</p>
                          <div className="flex flex-col">
                            {!isSpecial && discountInfo.discountPercentage > 0 && (
                              <span className="text-xs line-through text-gray-500">
                                ₪{(item.product.price * item.quantity).toFixed(2)}
                              </span>
                            )}
                            <p className="font-medium">
                              ₪{(itemPrice * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Price Breakdown */}
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>סה"כ לפני הנחה:</span>
                    <span>₪{discountInfo.originalPrice.toFixed(2)}</span>
                  </div>
                  
                  {discountInfo.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>הנחת כמות ({discountInfo.discountPercentage}% על רגילות):</span>
                      <span>-₪{discountInfo.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span>מחיר אחרי הנחה:</span>
                    <span>₪{discountInfo.finalPrice.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>משלוח:</span>
                    <span>{shippingCost > 0 ? `₪${shippingCost}` : "חינם"}</span>
                  </div>
                  
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>סה"כ לתשלום:</span>
                    <span>₪{finalTotalPrice}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  אמצעי תשלום
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
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
                  </div>
                </RadioGroup>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full mt-6" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="ms-2 h-4 w-4 animate-spin" />
                      שולח הזמנה...
                    </>
                  ) : (
                    `שלח הזמנה - ₪${finalTotalPrice}`
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

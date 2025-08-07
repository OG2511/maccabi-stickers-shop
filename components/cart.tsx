"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/hooks/use-cart"
import { ShoppingCart, Plus, Minus, Trash2, Gift } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"

export function Cart() {
  const { cart, updateQuantity, removeFromCart, totalItems, getDiscountInfo } = useCart()
  const discountInfo = getDiscountInfo()

  // Next discount tier info
  const getNextDiscountInfo = () => {
    if (discountInfo.regularQuantity < 6) return { needed: 6 - discountInfo.regularQuantity, discount: 10 }
    if (discountInfo.regularQuantity < 11) return { needed: 11 - discountInfo.regularQuantity, discount: 15 }
    if (discountInfo.regularQuantity < 16) return { needed: 16 - discountInfo.regularQuantity, discount: 20 }
    if (discountInfo.regularQuantity < 21) return { needed: 21 - discountInfo.regularQuantity, discount: 25 }
    return null
  }

  const nextDiscount = getNextDiscountInfo()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <ShoppingCart className="h-4 w-4" />
          {totalItems > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-right">סל הקניות ({totalItems} פריטים)</SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">הסל שלך ריק</p>
            <SheetClose asChild>
              <Link href="/shop">
                <Button>התחל לקנות</Button>
              </Link>
            </SheetClose>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Discount Information */}
            {discountInfo.regularQuantity > 0 && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">מדבקות רגילות:</span>
                    <span>{discountInfo.regularQuantity}</span>
                  </div>
                  
                  {discountInfo.specialQuantity > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium">מדבקות מיוחדות:</span>
                      <span>{discountInfo.specialQuantity}</span>
                    </div>
                  )}
                  
                  {discountInfo.discountPercentage > 0 && (
                    <div className="flex justify-between items-center text-green-700">
                      <span className="font-medium">הנחה נוכחית:</span>
                      <span>{discountInfo.discountPercentage}%</span>
                    </div>
                  )}
                  
                  {nextDiscount && (
                    <div className="text-xs text-green-600 bg-green-100 p-2 rounded">
                      <Gift className="inline h-3 w-3 ml-1" />
                      הוסף עוד {nextDiscount.needed} מדבקות רגילות וקבל {nextDiscount.discount}% הנחה!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Discount Tiers */}
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-xs text-gray-600">
                <p className="font-medium mb-1">דרגות הנחה (על מדבקות רגילות):</p>
                <div className="grid grid-cols-2 gap-1">
                  <span className={discountInfo.regularQuantity >= 6 && discountInfo.regularQuantity < 11 ? "text-green-600 font-medium" : ""}>
                    6-10: 10% הנחה
                  </span>
                  <span className={discountInfo.regularQuantity >= 11 && discountInfo.regularQuantity < 16 ? "text-green-600 font-medium" : ""}>
                    11-15: 15% הנחה
                  </span>
                  <span className={discountInfo.regularQuantity >= 16 && discountInfo.regularQuantity < 21 ? "text-green-600 font-medium" : ""}>
                    16-20: 20% הנחה
                  </span>
                  <span className={discountInfo.regularQuantity >= 21 ? "text-green-600 font-medium" : ""}>
                    21+: 25% הנחה
                  </span>
                </div>
                <p className="text-xs text-amber-600 mt-1">
                  * מדבקות מיוחדות במחיר מלא
                </p>
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Image
                    src={item.product.image_url || "/placeholder.svg?width=60&height=60"}
                    alt={item.product.name}
                    width={60}
                    height={60}
                    className="rounded object-cover"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm leading-tight">{item.product.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500">{item.product.collection}</p>
                      {item.product.collection === "מיוחדים" && (
                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                          מיוחד
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm font-bold">₪{item.product.price}</p>
                      {item.product.collection !== "מיוחדים" && discountInfo.discountPercentage > 0 && (
                        <p className="text-xs text-green-600">
                          (₪{(item.product.price * (1 - discountInfo.discountPercentage / 100)).toFixed(2)} אחרי הנחה)
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="h-8 w-8 p-0"
                      disabled={item.quantity >= item.product.stock}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromCart(item.product.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Summary */}
            <div className="border-t pt-4 space-y-2">
              {discountInfo.regularPrice > 0 && (
                <div className="flex justify-between text-sm">
                  <span>מדבקות רגילות ({discountInfo.regularQuantity}):</span>
                  <span>₪{discountInfo.regularPrice.toFixed(2)}</span>
                </div>
              )}
              
              {discountInfo.specialPrice > 0 && (
                <div className="flex justify-between text-sm">
                  <span>מדבקות מיוחדות ({discountInfo.specialQuantity}):</span>
                  <span>₪{discountInfo.specialPrice.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span>סה"כ לפני הנחה:</span>
                <span>₪{discountInfo.originalPrice.toFixed(2)}</span>
              </div>
              
              {discountInfo.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>הנחה ({discountInfo.discountPercentage}% על רגילות):</span>
                  <span>-₪{discountInfo.discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>סה"כ לתשלום:</span>
                <span>₪{Math.ceil(discountInfo.finalPrice)}</span>
              </div>
              
              <SheetClose asChild>
                <Link href="/checkout" className="block">
                  <Button className="w-full" size="lg">
                    המשך לתשלום
                  </Button>
                </Link>
              </SheetClose>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

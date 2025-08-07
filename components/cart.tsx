"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'
import { useCart } from "@/hooks/use-cart"
import Image from "next/image"
import Link from "next/link"

interface CartProps {
  onClose?: () => void
}

export function Cart({ onClose }: CartProps) {
  const items = useCart(state => state.items)
  const updateQuantity = useCart(state => state.updateQuantity)
  const removeFromCart = useCart(state => state.removeFromCart)
  const clearCart = useCart(state => state.clearCart)
  const getDiscountInfo = useCart(state => state.getDiscountInfo)

  const discountInfo = getDiscountInfo()

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <ShoppingBag className="h-16 w-16 text-muted-foreground" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">העגלה ריקה</h3>
          <p className="text-muted-foreground">הוסף מדבקות לעגלה כדי להתחיל</p>
        </div>
        <Button asChild onClick={onClose}>
          <Link href="/shop">עבור לחנות</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">עגלת קניות</h2>
        <Button variant="ghost" size="sm" onClick={clearCart}>
          <Trash2 className="h-4 w-4 mr-2" />
          רוקן עגלה
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center space-x-4 p-3 border rounded-lg">
              <div className="relative h-16 w-16 flex-shrink-0">
                <Image
                  src={item.image_url || "/placeholder.svg?width=64&height=64"}
                  alt={item.name}
                  fill
                  className="object-cover rounded"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-muted-foreground">{item.collection}</span>
                  <span className="font-semibold">₪{item.price}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removeFromCart(item.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t p-4 space-y-4">
        {/* Discount Info */}
        {discountInfo.regularQuantity > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>מדבקות רגילות:</span>
              <span>{discountInfo.regularQuantity}</span>
            </div>
            {discountInfo.specialQuantity > 0 && (
              <div className="flex justify-between text-sm">
                <span>מדבקות מיוחדות:</span>
                <span>{discountInfo.specialQuantity}</span>
              </div>
            )}
            {discountInfo.discountPercentage > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>הנחה ({discountInfo.discountPercentage}%):</span>
                <span>-₪{discountInfo.discountAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        <Separator />

        <div className="flex justify-between text-lg font-bold">
          <span>סה"כ:</span>
          <span>₪{discountInfo.finalTotal.toFixed(2)}</span>
        </div>

        {/* Discount Tiers Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>דרגות הנחה:</p>
          <div className="grid grid-cols-2 gap-1">
            <span className={discountInfo.regularQuantity >= 6 ? "text-green-600 font-medium" : ""}>
              6-10: 10%
            </span>
            <span className={discountInfo.regularQuantity >= 11 ? "text-green-600 font-medium" : ""}>
              11-15: 15%
            </span>
            <span className={discountInfo.regularQuantity >= 16 ? "text-green-600 font-medium" : ""}>
              16-20: 20%
            </span>
            <span className={discountInfo.regularQuantity >= 21 ? "text-green-600 font-medium" : ""}>
              21+: 25%
            </span>
          </div>
        </div>

        <Button asChild className="w-full" size="lg" onClick={onClose}>
          <Link href="/checkout">המשך לתשלום</Link>
        </Button>
      </div>
    </div>
  )
}

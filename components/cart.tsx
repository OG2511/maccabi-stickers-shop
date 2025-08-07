"use client"

import type React from "react"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { useCart } from "@/hooks/use-cart"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, Plus, Minus, Tag } from "lucide-react"

export function Cart({ children }: { children: React.ReactNode }) {
  const { cart, updateQuantity, removeFromCart, totalItems, totalPrice } = useCart()

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId)
    } else {
      updateQuantity(productId, newQuantity)
    }
  }

  // Calculate original price (before discount)
  const calculateOriginalPrice = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  }

  // Calculate discount percentage
  const getDiscountPercentage = () => {
    const regularItems = cart.filter((item) => item.product.collection !== "מיוחדים")
    const regularQuantity = regularItems.reduce((sum, item) => sum + item.quantity, 0)

    if (regularQuantity >= 21) return 35
    if (regularQuantity >= 11) return 25
    if (regularQuantity >= 6) return 15
    return 0
  }

  const originalPrice = calculateOriginalPrice()
  const discountPercentage = getDiscountPercentage()
  const hasDiscount = discountPercentage > 0

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>סל קניות ({totalItems})</SheetTitle>
          <SheetDescription>
            {cart.length > 0 ? `יש לך ${totalItems} פריטים בסל הקניות שלך` : "סל הקניות שלך ריק כרגע"}
          </SheetDescription>
        </SheetHeader>
        {cart.length > 0 ? (
          <>
            <ScrollArea className="flex-grow pr-4 -mr-6">
              <div className="flex flex-col gap-4 py-4">
                {cart.map((item) => {
                  const maxQuantity = item.product.stock
                  const isAtMaxStock = item.quantity >= maxQuantity
                  const isSpecial = item.product.collection === "מיוחדים"

                  return (
                    <div key={item.product.id} className="flex items-center gap-4">
                      <Image
                        src={item.product.image_url || "/placeholder.svg?width=100&height=100"}
                        alt={item.product.name}
                        width={64}
                        height={64}
                        className="rounded-md object-contain"
                      />
                      <div className="flex-grow">
                        <p className="font-medium">
                          {item.product.name}
                          {isSpecial && (
                            <span className="mr-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                              מיוחד
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">₪{item.product.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          max={maxQuantity}
                          value={item.quantity}
                          onChange={(e) => {
                            const newQuantity = Number.parseInt(e.target.value)
                            if (newQuantity >= 1 && newQuantity <= maxQuantity) {
                              updateQuantity(item.product.id, newQuantity)
                            }
                          }}
                          className="w-16 text-center"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                          disabled={isAtMaxStock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
            <SheetFooter className="mt-auto border-t pt-4">
              <div className="w-full space-y-4">
                {hasDiscount && (
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">מחיר מקורי:</span>
                      <span className="line-through text-muted-foreground">₪{originalPrice}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1 text-green-600">
                        <Tag className="h-4 w-4" />
                        הנחת כמות:
                      </span>
                      <span className="text-green-600 font-medium">-{discountPercentage}%</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>סה"כ לתשלום:</span>
                  <span className={hasDiscount ? "text-green-600" : ""}>₪{totalPrice}</span>
                </div>
                <SheetClose asChild>
                  <Button asChild className="w-full" size="lg">
                    <Link href="/checkout">מעבר לתשלום</Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-lg text-muted-foreground">סל הקניות שלך ריק.</p>
            <SheetClose asChild>
              <Button asChild variant="link" className="mt-4">
                <Link href="/shop">המשך קניות</Link>
              </Button>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useCart } from "@/hooks/use-cart"
import type { Product } from "@/lib/types"
import { PlusCircle, Minus, Plus, Calculator } from "lucide-react"

interface ProductModalProps {
  product: Product
  children: React.ReactNode
}

export function ProductModal({ product, children }: ProductModalProps) {
  const { addToCart, cart } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [open, setOpen] = useState(false)

  // Calculate how many of this product are already in cart
  const cartItem = cart.find((item) => item.product.id === product.id)
  const quantityInCart = cartItem ? cartItem.quantity : 0
  const availableStock = product.stock - quantityInCart
  const isOutOfStock = availableStock <= 0

  // Calculate regular items in cart (for special stickers validation)
  const regularItemsInCart = cart
    .filter((item) => item.product.collection !== "מיוחדים")
    .reduce((sum, item) => sum + item.quantity, 0)

  // Calculate discount preview
  const calculateDiscountPreview = (newQuantity: number) => {
    // Create a temporary cart with the new quantity added
    const tempCart = [...cart]
    const existingItemIndex = tempCart.findIndex((item) => item.product.id === product.id)

    if (existingItemIndex >= 0) {
      tempCart[existingItemIndex] = {
        ...tempCart[existingItemIndex],
        quantity: tempCart[existingItemIndex].quantity + newQuantity,
      }
    } else {
      tempCart.push({ product, quantity: newQuantity })
    }

    // Calculate totals
    const regularItems = tempCart.filter((item) => item.product.collection !== "מיוחדים")
    const specialItems = tempCart.filter((item) => item.product.collection === "מיוחדים")

    const regularQuantity = regularItems.reduce((sum, item) => sum + item.quantity, 0)

    let discount = 0
    if (regularQuantity >= 21) {
      discount = 0.35
    } else if (regularQuantity >= 11) {
      discount = 0.25
    } else if (regularQuantity >= 6) {
      discount = 0.15
    }

    const regularPrice = regularItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const discountedRegularPrice = regularPrice * (1 - discount)
    const specialPrice = specialItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

    return {
      originalPrice: regularPrice + specialPrice,
      finalPrice: Math.ceil(discountedRegularPrice + specialPrice),
      discount: discount,
      regularQuantity,
    }
  }

  const handleAddToCart = () => {
    addToCart(product, quantity)
    setQuantity(1) // Reset quantity after adding
  }

  const maxQuantity = availableStock // Only limit by available stock
  const pricePreview = calculateDiscountPreview(quantity)
  const itemPrice = product.price * quantity

  // Calculate the number of regular items in the cart
  const regularItemsInCart2 = cart.reduce((sum, item) => {
    if (item.product.collection !== "מיוחדים") {
      return sum + item.quantity
    }
    return sum
  }, 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-right">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Image */}
          <div className="relative aspect-square w-full bg-gray-50 rounded-lg overflow-hidden">
            <Image
              src={product.image_url || "/placeholder.svg?width=600&height=600"}
              alt={product.name}
              fill
              className="object-contain p-4"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="destructive" className="text-white text-lg px-4 py-2">
                  אזל מהמלאי
                </Badge>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Collection Badge */}
            <div>
              <Badge variant="outline" className="text-sm">
                {product.collection}
              </Badge>
            </div>

            {/* Price */}
            <div className="text-3xl font-bold text-primary">₪{product.price}</div>

            {/* Stock Info */}
            <div className="space-y-2">
              {quantityInCart > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">בסל הקניות:</span>
                  <span className="text-primary font-medium">{quantityInCart} יחידות</span>
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div className="space-y-3">
                <label className="text-sm font-medium">כמות:</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>

                  <span className="text-xl font-semibold min-w-[3rem] text-center">{quantity}</span>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Price Preview with Discount */}
            {!isOutOfStock && product.collection !== "מיוחדים" && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">חישוב מחיר</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>מחיר פריט:</span>
                    <span>₪{itemPrice}</span>
                  </div>
                  {pricePreview.discount > 0 && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>הנחה ({Math.round(pricePreview.discount * 100)}%):</span>
                        <span>-₪{Math.ceil(itemPrice * pricePreview.discount)}</span>
                      </div>
                      <div className="border-t pt-1 flex justify-between font-medium">
                        <span>מחיר סופי:</span>
                        <span>₪{Math.ceil(itemPrice * (1 - pricePreview.discount))}</span>
                      </div>
                    </>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    סה"כ מדבקות רגילות בסל: {pricePreview.regularQuantity}
                  </div>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <Button onClick={handleAddToCart} disabled={isOutOfStock} className="w-full text-lg py-6" size="lg">
              <PlusCircle className="ml-2 h-5 w-5" />
              {isOutOfStock ? "אזל מהמלאי" : `הוסף ${quantity} לסל`}
            </Button>

            {/* Special Collection Info */}
            {product.collection === "מיוחדים" && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="text-sm text-amber-800 space-y-1">
                  <p className="font-medium text-base">⭐ מדבקה מיוחדת</p>
                  <ul className="list-disc list-inside space-y-1 mr-4">
                    <li>דרושות לפחות 10 מדבקות רגילות בסל לפני הוספת מדבקה מיוחדת</li>
                    <li>מקסימום 3 מדבקות מיוחדות להזמנה</li>
                    <li>מדבקות מיוחדות אינן כלולות בהנחות כמות</li>
                  </ul>
                  {quantityInCart === 0 && regularItemsInCart < 10 && (
                    <p className="mt-2 text-red-600 font-medium">
                      שים לב: עליך להוסיף לפחות 10 מדבקות רגילות לסל לפני שתוכל להוסיף מדבקה מיוחדת זו
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

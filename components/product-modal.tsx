"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Minus, ShoppingCart, Gift } from 'lucide-react'
import Image from "next/image"
import type { Product } from "@/lib/types"

interface ProductModalProps {
  product: Product
  children: React.ReactNode
}

export function ProductModal({ product, children }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  const { addToCart, getDiscountInfo } = useCart()
  const { toast } = useToast()

  const discountInfo = getDiscountInfo()
  const isSpecial = product.collection === "מיוחדים"

  // Calculate what discount would be with this addition
  const getDiscountWithAddition = () => {
    if (isSpecial) return discountInfo.discountPercentage // Special items don't affect discount
    
    const newRegularQuantity = discountInfo.regularQuantity + quantity
    
    if (newRegularQuantity >= 21) return 25
    if (newRegularQuantity >= 16) return 20
    if (newRegularQuantity >= 11) return 15
    if (newRegularQuantity >= 6) return 10
    return 0
  }

  const newDiscountPercentage = getDiscountWithAddition()
  const willGetNewDiscount = newDiscountPercentage > discountInfo.discountPercentage

  const handleAddToCart = () => {
    addToCart(product, quantity)
    setIsOpen(false)
    setQuantity(1)
  }

  const increaseQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(prev => prev + 1)
    }
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }

  const effectivePrice = isSpecial 
    ? product.price 
    : discountInfo.discountPercentage > 0 
      ? product.price * (1 - discountInfo.discountPercentage / 100)
      : product.price

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-right">{product.name}</DialogTitle>
          <DialogDescription className="text-right">
            פרטי המוצר ואפשרויות הזמנה
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Product Image */}
          <div className="relative aspect-square">
            <Image
              src={product.image_url || "/placeholder.svg?width=400&height=400"}
              alt={product.name}
              fill
              className="object-cover rounded-lg"
            />
          </div>
          
          {/* Product Details */}
          <div className="space-y-4">
            <div>
              <Badge variant="secondary" className="mb-2">
                {product.collection}
              </Badge>
              {isSpecial && (
                <Badge variant="outline" className="mr-2 bg-amber-50 text-amber-700 border-amber-200">
                  מיוחד
                </Badge>
              )}
              <h2 className="text-2xl font-bold">{product.name}</h2>
              <div className="mt-2">
                {!isSpecial && discountInfo.discountPercentage > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg line-through text-gray-500">₪{product.price}</span>
                    <span className="text-xl font-semibold text-green-600">
                      ₪{effectivePrice.toFixed(2)}
                    </span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      -{discountInfo.discountPercentage}%
                    </Badge>
                  </div>
                ) : (
                  <p className="text-xl font-semibold text-primary">₪{product.price}</p>
                )}
              </div>
            </div>

            {product.description && (
              <p className="text-gray-600">{product.description}</p>
            )}

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">במלאי:</span>
              <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                {product.stock > 0 ? `${product.stock} יחידות` : "אזל מהמלאי"}
              </Badge>
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">כמות:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={increaseQuantity}
                      disabled={quantity >= product.stock}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Special product notice */}
                {isSpecial && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800">
                      <span className="font-medium">מדבקה מיוחדת:</span> ניתן להזמין עד 3 מדבקות מיוחדות בלבד, 
                      ורק לאחר הוספת לפחות 10 מדבקות רגילות לסל.
                    </p>
                  </div>
                )}

                {/* Discount Information */}
                {!isSpecial && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm space-y-1">
                      <p className="font-medium text-blue-800">
                        מדבקות רגילות בסל: {discountInfo.regularQuantity}
                      </p>
                      <p className="text-blue-600">
                        אחרי הוספה: {discountInfo.regularQuantity + quantity}
                      </p>
                      
                      {willGetNewDiscount && (
                        <div className="bg-green-100 border border-green-200 rounded p-2 mt-2">
                          <p className="text-green-800 font-medium flex items-center gap-1">
                            <Gift className="h-4 w-4" />
                            תקבל {newDiscountPercentage}% הנחה על כל המדבקות הרגילות!
                          </p>
                        </div>
                      )}
                      
                      {discountInfo.discountPercentage > 0 && !willGetNewDiscount && (
                        <p className="text-green-600">
                          הנחה נוכחית: {discountInfo.discountPercentage}%
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Discount Tiers */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">דרגות הנחה:</p>
                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                    <span>1-5: ללא הנחה</span>
                    <span>6-10: 10% הנחה</span>
                    <span>11-15: 15% הנחה</span>
                    <span>16-20: 20% הנחה</span>
                    <span className="col-span-2">21+: 25% הנחה</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-lg font-bold">
                  <span>סה"כ:</span>
                  <span>₪{(effectivePrice * quantity).toFixed(2)}</span>
                </div>

                <Button 
                  onClick={handleAddToCart}
                  className="w-full"
                  size="lg"
                >
                  <ShoppingCart className="ms-2 h-4 w-4" />
                  הוסף לסל - ₪{(effectivePrice * quantity).toFixed(2)}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

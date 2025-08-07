"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/components/ui/use-toast"
import { ShoppingCart, Eye } from 'lucide-react'
import Image from "next/image"
import { ProductModal } from "./product-modal"
import type { Product } from "@/lib/types"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { addToCart, cart, getDiscountInfo } = useCart()
  const { toast } = useToast()

  const discountInfo = getDiscountInfo()
  const isSpecialProduct = product.collection === "מיוחדים"

  const handleQuickAdd = () => {
    // Validation for special products
    if (isSpecialProduct) {
      const regularItemsCount = cart
        .filter(item => item.product.collection !== "מיוחדים")
        .reduce((sum, item) => sum + item.quantity, 0)

      if (regularItemsCount < 10) {
        toast({
          title: "לא ניתן להוסיף מדבקה מיוחדת",
          description: "יש להוסיף לפחות 10 מדבקות רגילות לסל קודם",
          variant: "destructive",
        })
        return
      }

      const specialItemsCount = cart
        .filter(item => item.product.collection === "מיוחדים")
        .reduce((sum, item) => sum + item.quantity, 0)

      if (specialItemsCount >= 3) {
        toast({
          title: "הגעת למגבלת המדבקות המיוחדות",
          description: "ניתן להוסיף מקסימום 3 מדבקות מיוחדות להזמנה",
          variant: "destructive",
        })
        return
      }
    }

    addToCart(product, 1)
  }

  const effectivePrice = isSpecialProduct 
    ? product.price 
    : discountInfo.discountPercentage > 0 
      ? product.price * (1 - discountInfo.discountPercentage / 100)
      : product.price

  return (
    <>
      <Card className="group hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="relative mb-3">
            <Image
              src={product.image_url || "/placeholder.svg?width=200&height=200"}
              alt={product.name}
              width={200}
              height={200}
              className="w-full h-48 object-cover rounded-lg"
            />
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <span className="text-white font-bold">אזל מהמלאי</span>
              </div>
            )}
            {isSpecialProduct && (
              <Badge className="absolute top-2 right-2 bg-amber-500 hover:bg-amber-600">
                מיוחד ⭐
              </Badge>
            )}
          </div>
          
          <div className="space-y-2">
            <div>
              <Badge variant="outline" className="text-xs mb-1">
                {product.collection}
              </Badge>
              <h3 className="font-semibold text-sm leading-tight">{product.name}</h3>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                {!isSpecialProduct && discountInfo.discountPercentage > 0 ? (
                  <div className="flex flex-col">
                    <span className="text-xs line-through text-gray-500">₪{product.price}</span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-green-600">₪{effectivePrice.toFixed(2)}</span>
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                        -{discountInfo.discountPercentage}%
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <span className="font-bold">₪{product.price}</span>
                )}
              </div>
              <span className="text-xs text-gray-500">{product.stock} במלאי</span>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="flex-1"
              >
                <Eye className="w-3 h-3 ml-1" />
                צפה
              </Button>
              <Button
                size="sm"
                onClick={handleQuickAdd}
                disabled={product.stock === 0}
                className="flex-1"
              >
                <ShoppingCart className="w-3 h-3 ml-1" />
                הוסף
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ProductModal
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}

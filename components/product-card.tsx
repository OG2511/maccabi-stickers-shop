"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Eye, Plus, Minus } from 'lucide-react'
import { useCart } from "@/hooks/use-cart"
import { ProductModal } from "@/components/product-modal"
import { StockIndicator } from "@/components/stock-indicator"
import type { Product } from "@/lib/types"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [showModal, setShowModal] = useState(false)
  const addToCart = useCart(state => state.addToCart)
  const updateQuantity = useCart(state => state.updateQuantity)
  const removeFromCart = useCart(state => state.removeFromCart)
  const getItemQuantity = useCart(state => state.getItemQuantity)
  
  const quantityInCart = getItemQuantity(product.id)
  const isOutOfStock = product.stock <= 0
  const isSpecial = product.collection === "מיוחדים"

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addToCart(product)
  }

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateQuantity(product.id, quantityInCart + 1)
  }

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (quantityInCart > 1) {
      updateQuantity(product.id, quantityInCart - 1)
    } else {
      removeFromCart(product.id)
    }
  }

  return (
    <>
      <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] overflow-hidden">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={product.image_url || "/placeholder.svg?width=300&height=300"}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onClick={() => setShowModal(true)}
          />
          
          {/* Overlay with quick actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation()
                setShowModal(true)
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              צפייה
            </Button>
            {!isOutOfStock && (
              <Button
                size="sm"
                onClick={handleAddToCart}
                disabled={quantityInCart >= product.stock}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                הוסף
              </Button>
            )}
          </div>

          {/* Badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {isSpecial && (
              <Badge className="bg-yellow-500 text-black hover:bg-yellow-600">
                מיוחד ⭐
              </Badge>
            )}
            {quantityInCart > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                בסל: {quantityInCart}
              </Badge>
            )}
          </div>

          {/* Stock indicator overlay for out of stock */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <Badge variant="destructive" className="text-lg px-4 py-2">
                אזל מהמלאי
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-sm line-clamp-2 flex-1">
                {product.name}
              </h3>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{product.collection}</span>
              <StockIndicator stock={product.stock} showIcon={false} />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-primary">
                ₪{product.price}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          {quantityInCart > 0 ? (
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="icon"
                onClick={handleDecrement}
                className="h-8 w-8"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-lg px-4">{quantityInCart}</span>
              <Button
                size="icon"
                onClick={handleIncrement}
                disabled={quantityInCart >= product.stock}
                className="h-8 w-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              className="w-full"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {isOutOfStock ? "אזל מהמלאי" : "הוסף לסל"}
            </Button>
          )}
        </CardFooter>
      </Card>

      <ProductModal
        product={product}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  )
}

"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/hooks/use-cart"
import { ProductModal } from "@/components/product-modal"
import type { Product } from "@/lib/types"
import { PlusCircle, Eye } from "lucide-react"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, cart } = useCart()

  // Calculate how many of this product are already in cart
  const cartItem = cart.find((item) => item.product.id === product.id)
  const quantityInCart = cartItem ? cartItem.quantity : 0
  const availableStock = product.stock - quantityInCart
  const isOutOfStock = availableStock <= 0

  return (
    <Card className="flex flex-col overflow-hidden group hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="p-0">
        <ProductModal product={product}>
          <div className="aspect-square relative w-full cursor-pointer group-hover:bg-gray-50 transition-colors">
            <Image
              src={product.image_url || "/placeholder.svg?width=400&height=400"}
              alt={product.name}
              fill
              className="object-contain transition-transform duration-200 group-hover:scale-105"
            />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 rounded-full p-2">
                <Eye className="h-5 w-5 text-gray-700" />
              </div>
            </div>

            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="destructive" className="text-white">
                  אזל מהמלאי
                </Badge>
              </div>
            )}
          </div>
        </ProductModal>
      </CardHeader>

      <CardContent className="p-3 flex-grow">
        <CardTitle className="text-base font-medium leading-tight">{product.name}</CardTitle>
        {quantityInCart > 0 && (
          <div className="mt-2 text-sm text-primary font-medium">סה"כ מדבקות בסל: {quantityInCart}</div>
        )}
      </CardContent>

      <CardFooter className="p-3 flex flex-col items-stretch gap-3">
        <p className="text-xl font-bold text-center">₪{product.price}</p>

        {/* Main Add to Cart Button */}
        <Button
          onClick={() => addToCart(product)}
          size="sm"
          disabled={isOutOfStock}
          variant={isOutOfStock ? "secondary" : "default"}
          className="w-full text-sm"
        >
          <PlusCircle className="ms-2 h-4 w-4" />
          {isOutOfStock ? "אזל מהמלאי" : "הוספה לסל"}
        </Button>

        {/* View Details Button */}
        <ProductModal product={product}>
          <Button variant="outline" size="sm" className="w-full text-sm bg-transparent">
            <Eye className="ms-2 h-4 w-4" />
            פרטים נוספים
          </Button>
        </ProductModal>
      </CardFooter>
    </Card>
  )
}

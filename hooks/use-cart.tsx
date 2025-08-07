"use client"

import type { Product, CartItem } from "@/lib/types"
import { createContext, useContext, useState, type ReactNode } from "react"
import { useToast } from "@/components/ui/use-toast"

type CartContextType = {
  cart: CartItem[]
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([])
  const { toast } = useToast()

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  const calculateTotalPrice = (currentCart: CartItem[]) => {
    const regularItems = currentCart.filter((item) => item.product.collection !== "מיוחדים")
    const specialItems = currentCart.filter((item) => item.product.collection === "מיוחדים")

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

    return Math.ceil(discountedRegularPrice + specialPrice)
  }

  const totalPrice = calculateTotalPrice(cart)

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prevCart) => {
      // Check stock availability
      const existingItem = prevCart.find((item) => item.product.id === product.id)
      const currentQuantityInCart = existingItem ? existingItem.quantity : 0
      const requestedTotalQuantity = currentQuantityInCart + quantity

      if (requestedTotalQuantity > product.stock) {
        toast({
          title: "אין מספיק במלאי",
          description: `לא ניתן להוסיף יותר מ-${product.name}. יש לך כבר ${currentQuantityInCart} בסל.`,
          variant: "destructive",
        })
        return prevCart
      }

      // Rules for "מיוחדים"
      if (product.collection === "מיוחדים") {
        const regularItemsCount = prevCart
          .filter((item) => item.product.collection !== "מיוחדים")
          .reduce((sum, item) => sum + item.quantity, 0)

        if (regularItemsCount < 10) {
          toast({
            title: "לא ניתן להוסיף מדבקה מיוחדת",
            description: "יש להוסיף לפחות 10 מדבקות רגילות לסל לפני הוספת מדבקה מיוחדת",
            variant: "destructive",
          })
          return prevCart
        }

        const specialItemsCount = prevCart
          .filter((item) => item.product.collection === "מיוחדים")
          .reduce((sum, item) => sum + item.quantity, 0)

        if (specialItemsCount + quantity > 3) {
          toast({
            title: "הגעת למגבלת המדבקות המיוחדות",
            description: "ניתן להוסיף מקסימום 3 מדבקות מיוחדות להזמנה",
            variant: "destructive",
          })
          return prevCart
        }
      }

      let newCart
      if (existingItem) {
        newCart = prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      } else {
        newCart = [...prevCart, { product, quantity }]
      }

      toast({
        title: "נוסף לסל",
        description: `${product.name} נוסף לסל הקניות.`,
      })
      return newCart
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart((prevCart) => {
        const item = prevCart.find((item) => item.product.id === productId)
        if (!item) return prevCart

        // Check stock availability
        if (quantity > item.product.stock) {
          toast({
            title: "אין מספיק במלאי",
            description: `לא ניתן להוסיף יותר מ-${item.product.name}.`,
            variant: "destructive",
          })
          return prevCart
        }

        return prevCart.map((cartItem) => (cartItem.product.id === productId ? { ...cartItem, quantity } : cartItem))
      })
    }
  }

  const clearCart = () => {
    setCart([])
  }

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

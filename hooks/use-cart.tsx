"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useToast } from "@/components/ui/use-toast"
import type { Product } from "@/lib/types"

export interface CartItem {
  product: Product
  quantity: number
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  getDiscountInfo: () => {
    regularQuantity: number
    specialQuantity: number
    regularPrice: number
    specialPrice: number
    discountPercentage: number
    discountAmount: number
    finalPrice: number
    originalPrice: number
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const { toast } = useToast()

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("maccabi-cart")
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (error) {
        console.error("Error loading cart from localStorage:", error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("maccabi-cart", JSON.stringify(cart))
  }, [cart])

  const addToCart = (product: Product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id)
      const currentQuantityInCart = existingItem ? existingItem.quantity : 0
      const requestedTotalQuantity = currentQuantityInCart + quantity

      // Check stock availability
      if (requestedTotalQuantity > product.stock) {
        toast({
          title: "אין מספיק במלאי",
          description: `לא ניתן להוסיף יותר מ-${product.stock} יחידות של ${product.name}`,
          variant: "destructive",
        })
        return prevCart
      }

      // Special items validation
      if (product.collection === "מיוחדים") {
        // Check if there are at least 10 regular items in cart
        const regularItemsCount = prevCart
          .filter(item => item.product.collection !== "מיוחדים")
          .reduce((sum, item) => sum + item.quantity, 0)

        if (regularItemsCount < 10) {
          toast({
            title: "לא ניתן להוסיף מדבקה מיוחדת",
            description: "יש להוסיף לפחות 10 מדבקות רגילות לסל קודם",
            variant: "destructive",
          })
          return prevCart
        }

        // Check special items limit (max 3)
        const specialItemsCount = prevCart
          .filter(item => item.product.collection === "מיוחדים")
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

      // Add or update item
      let newCart
      if (existingItem) {
        newCart = prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(requestedTotalQuantity, product.stock) }
            : item
        )
      } else {
        newCart = [...prevCart, { product, quantity: Math.min(quantity, product.stock) }]
      }

      toast({
        title: "נוסף לסל",
        description: `${product.name} נוסף לסל הקניות`,
      })

      return newCart
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart(prevCart => {
      const item = prevCart.find(item => item.product.id === productId)
      if (!item) return prevCart

      // Check stock availability
      if (quantity > item.product.stock) {
        toast({
          title: "אין מספיק במלאי",
          description: `לא ניתן להוסיף יותר מ-${item.product.stock} יחידות של ${item.product.name}`,
          variant: "destructive",
        })
        return prevCart
      }

      // Special validation for special items
      if (item.product.collection === "מיוחדים") {
        const regularItemsCount = prevCart
          .filter(cartItem => cartItem.product.collection !== "מיוחדים")
          .reduce((sum, cartItem) => sum + cartItem.quantity, 0)

        if (regularItemsCount < 10) {
          toast({
            title: "לא ניתן לעדכן מדבקה מיוחדת",
            description: "יש להוסיף לפחות 10 מדבקות רגילות לסל קודם",
            variant: "destructive",
          })
          return prevCart
        }

        const otherSpecialItemsCount = prevCart
          .filter(cartItem => cartItem.product.collection === "מיוחדים" && cartItem.product.id !== productId)
          .reduce((sum, cartItem) => sum + cartItem.quantity, 0)

        if (otherSpecialItemsCount + quantity > 3) {
          toast({
            title: "הגעת למגבלת המדבקות המיוחדות",
            description: "ניתן להוסיף מקסימום 3 מדבקות מיוחדות להזמנה",
            variant: "destructive",
          })
          return prevCart
        }
      }

      return prevCart.map(cartItem =>
        cartItem.product.id === productId
          ? { ...cartItem, quantity: Math.min(quantity, cartItem.product.stock) }
          : cartItem
      )
    })
  }

  const clearCart = () => {
    setCart([])
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  const getDiscountInfo = () => {
    const regularItems = cart.filter(item => item.product.collection !== "מיוחדים")
    const specialItems = cart.filter(item => item.product.collection === "מיוחדים")
    
    const regularQuantity = regularItems.reduce((sum, item) => sum + item.quantity, 0)
    const specialQuantity = specialItems.reduce((sum, item) => sum + item.quantity, 0)
    const regularPrice = regularItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const specialPrice = specialItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    
    // Calculate discount percentage based on regular stickers count
    let discountPercentage = 0
    if (regularQuantity >= 21) {
      discountPercentage = 25
    } else if (regularQuantity >= 16) {
      discountPercentage = 20
    } else if (regularQuantity >= 11) {
      discountPercentage = 15
    } else if (regularQuantity >= 6) {
      discountPercentage = 10
    }
    
    const discountAmount = regularPrice * (discountPercentage / 100)
    const finalPrice = regularPrice - discountAmount + specialPrice
    const originalPrice = regularPrice + specialPrice

    return {
      regularQuantity,
      specialQuantity,
      regularPrice,
      specialPrice,
      discountPercentage,
      discountAmount,
      finalPrice,
      originalPrice
    }
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        getDiscountInfo
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

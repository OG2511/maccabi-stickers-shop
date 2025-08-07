"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/lib/types'

export interface CartItem {
  id: string
  name: string
  price: number
  image_url: string
  collection: string
  quantity: number
  stock: number
}

interface CartStore {
  items: CartItem[]
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getItemQuantity: (productId: string) => number
  getTotalItems: () => number
  getTotalPrice: () => number
  getDiscountInfo: () => {
    regularQuantity: number
    specialQuantity: number
    discountPercentage: number
    discountAmount: number
    finalTotal: number
  }
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (product: Product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(item => item.id === product.id)
          
          if (existingItem) {
            const newQuantity = existingItem.quantity + quantity
            if (newQuantity <= product.stock) {
              return {
                items: state.items.map(item =>
                  item.id === product.id
                    ? { ...item, quantity: newQuantity }
                    : item
                )
              }
            }
            return state
          } else {
            if (quantity <= product.stock) {
              return {
                items: [...state.items, {
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image_url: product.image_url,
                  collection: product.collection,
                  quantity,
                  stock: product.stock
                }]
              }
            }
            return state
          }
        })
      },

      removeFromCart: (productId: string) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== productId)
        }))
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(productId)
          return
        }

        set((state) => ({
          items: state.items.map(item =>
            item.id === productId
              ? { ...item, quantity: Math.min(quantity, item.stock) }
              : item
          )
        }))
      },

      clearCart: () => {
        set({ items: [] })
      },

      getItemQuantity: (productId: string) => {
        const item = get().items.find(item => item.id === productId)
        return item?.quantity || 0
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        const { finalTotal } = get().getDiscountInfo()
        return finalTotal
      },

      getDiscountInfo: () => {
        const items = get().items
        const regularItems = items.filter(item => item.collection !== "מיוחדים")
        const specialItems = items.filter(item => item.collection === "מיוחדים")
        
        const regularQuantity = regularItems.reduce((sum, item) => sum + item.quantity, 0)
        const specialQuantity = specialItems.reduce((sum, item) => sum + item.quantity, 0)
        
        const regularTotal = regularItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        const specialTotal = specialItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        
        // Discount tiers for regular items only
        let discountPercentage = 0
        if (regularQuantity >= 21) discountPercentage = 25
        else if (regularQuantity >= 16) discountPercentage = 20
        else if (regularQuantity >= 11) discountPercentage = 15
        else if (regularQuantity >= 6) discountPercentage = 10
        
        const discountAmount = regularTotal * (discountPercentage / 100)
        const discountedRegularTotal = regularTotal - discountAmount
        const finalTotal = discountedRegularTotal + specialTotal
        
        return {
          regularQuantity,
          specialQuantity,
          discountPercentage,
          discountAmount,
          finalTotal
        }
      }
    }),
    {
      name: 'cart-storage',
      version: 1,
    }
  )
)

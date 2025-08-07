// Final integrated logic for maccabi-stickers-shop
// Includes discount rules, special item constraints, delivery charge, conditional checkout fields, and overbooking prevention

import { CartItem } from "@/lib/types"
import { checkStockAvailability } from "@/lib/stock-check"

export function calculateDiscount(cartItems: CartItem[]) {
  const regularItems = cartItems.filter(
    (item) => item.product.collection !== "special"
  )
  const regularQty = regularItems.reduce((sum, item) => sum + item.quantity, 0)

  if (regularQty >= 21) return 0.75
  if (regularQty >= 16) return 0.80
  if (regularQty >= 11) return 0.85
  if (regularQty >= 6) return 0.90
  return 1
}

export function canAddSpecialItem(cartItems: CartItem[]) {
  const specialCount = cartItems.filter(
    (item) => item.product.collection === "special"
  ).reduce((sum, item) => sum + item.quantity, 0)

  const regularCount = cartItems.filter(
    (item) => item.product.collection !== "special"
  ).reduce((sum, item) => sum + item.quantity, 0)

  return specialCount < 3 && regularCount >= 10
}

export function calculateTotal(cartItems: CartItem[], delivery: boolean) {
  const discountFactor = calculateDiscount(cartItems)
  const total = cartItems.reduce((sum, item) => {
    const isSpecial = item.product.collection === "special"
    const price = item.product.price
    return sum + item.quantity * price * (isSpecial ? 1 : discountFactor)
  }, 0)
  return delivery ? total + 15 : total
}

export function getCheckoutFields(delivery: boolean) {
  const commonFields = ["firstName", "lastName", "phone"]
  if (delivery) {
    return [...commonFields, "city", "street", "postalCode"]
  }
  return commonFields
}

export async function validateOrderAgainstStock(cartItems: CartItem[]) {
  for (const item of cartItems) {
    const inStock = await checkStockAvailability(item.product.id, item.quantity)
    if (!inStock) {
      throw new Error(`המוצר "${item.product.name}" לא זמין במלאי בכמות המבוקשת.`)
    }
  }
}

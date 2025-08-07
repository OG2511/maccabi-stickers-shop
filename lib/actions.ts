"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "./supabase/server"
import type { CartItem } from "./types"

// יצירת מופע יחיד של Supabase client
let supabaseClient: any = null

function getServerActionClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  supabaseClient = createClient()
  console.log("🔧 Server Action Supabase client created (singleton)")
  return supabaseClient
}

export async function submitOrder(formData: FormData, cart: CartItem[], totalPrice: number) {
  console.log("🟢 Starting submitOrder action")

  try {
    // Add mobile detection
    const userAgent = (formData.get("userAgent") as string) || "unknown"
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)

    console.log("📱 Order submission:", {
      isMobile,
      cartItems: cart.length,
      totalPrice,
      userAgent: userAgent.substring(0, 50) + "...",
    })

    const supabase = getServerActionClient()

    // Validate cart is not empty
    if (!cart || cart.length === 0) {
      console.error("🔴 Cart is empty")
      return { success: false, error: "העגלה ריקה" }
    }

    // Validate total price
    if (!totalPrice || totalPrice <= 0) {
      console.error("🔴 Invalid total price:", totalPrice)
      return { success: false, error: "מחיר לא תקין" }
    }

    // First, validate stock availability for all items
    for (const item of cart) {
      if (!item.product || !item.product.id) {
        console.error("🔴 Invalid cart item:", item)
        return { success: false, error: "פריט לא תקין בעגלה" }
      }

      const { data: product, error } = await supabase
        .from("products")
        .select("stock, name")
        .eq("id", item.product.id)
        .single()

      if (error || !product) {
        console.error("🔴 Product not found:", item.product.id, error)
        return { success: false, error: `מוצר ${item.product.name} לא נמצא.` }
      }

      if (product.stock < item.quantity) {
        console.error("🔴 Insufficient stock:", {
          productId: item.product.id,
          requested: item.quantity,
          available: product.stock
        })
        return {
          success: false,
          error: `אין מספיק במלאי עבור ${product.name}. יש במלאי רק ${product.stock} יחידות.`,
        }
      }
    }

    // Validate form data
    const fullName = formData.get("fullName") as string
    const phone = formData.get("phone") as string
    const deliveryOption = formData.get("deliveryOption") as string
    const paymentMethod = formData.get("paymentMethod") as string

    if (!fullName || !phone) {
      console.error("🔴 Missing required fields:", { fullName: !!fullName, phone: !!phone })
      return { success: false, error: "שדות חובה חסרים" }
    }

    // Validate payment method
    const validPaymentMethods = ["bit", "paypal", "paybox"]
    if (!validPaymentMethods.includes(paymentMethod)) {
      console.error("🔴 Invalid payment method:", paymentMethod)
      return { success: false, error: "אמצעי תשלום לא תקין" }
    }

    // Validate delivery option
    const validDeliveryOptions = ["self_pickup", "israel_post"]
    if (!validDeliveryOptions.includes(deliveryOption)) {
      console.error("🔴 Invalid delivery option:", deliveryOption)
      return { success: false, error: "אופן משלוח לא תקין" }
    }

    // Validate delivery address if needed
    if (deliveryOption === "israel_post") {
      const city = formData.get("city") as string
      const street = formData.get("street") as string
      
      if (!city || !street) {
        console.error("🔴 Missing delivery address:", { city: !!city, street: !!street })
        return { success: false, error: "כתובת משלוח חסרה" }
      }
    }

    const orderData = {
      customer_name: fullName,
      customer_phone: phone,
      delivery_option: deliveryOption as "self_pickup" | "israel_post",
      payment_method: paymentMethod as "bit" | "paypal" | "paybox",
      city: (formData.get("city") as string) || null,
      street: (formData.get("street") as string) || null,
      house_number: (formData.get("houseNumber") as string) || null,
      zip_code: (formData.get("zipCode") as string) || null,
      total_amount: totalPrice,
      status: "pending" as const,
    }

    console.log("🟢 Order data prepared:", {
      ...orderData,
      customer_phone: orderData.customer_phone.substring(0, 3) + "***"
    })

    // 1. Create the order
    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single()

    if (orderError || !newOrder) {
      console.error("🔴 Supabase order error:", orderError)
      return { success: false, error: "שגיאה ביצירת ההזמנה. אנא נסה שוב." }
    }

    console.log("🟢 Order created with ID:", newOrder.id)

    // 2. Create order items
    const orderItems = cart.map((item) => ({
      order_id: newOrder.id,
      product_id: item.product.id,
      quantity: item.quantity,
      price_per_item: item.product.price,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("🔴 Supabase order items error:", itemsError)
      await supabase.from("orders").delete().match({ id: newOrder.id })
      return { success: false, error: "שגיאה בשמירת פריטי ההזמנה. אנא נסה שוב." }
    }

    console.log("🟢 Order items created successfully")

    // 3. Send notifications
    await sendNotifications(newOrder, orderData, userAgent, isMobile)

    console.log("✅ Order completed successfully")
    revalidatePath("/admin/orders")
    revalidatePath("/shop")

    return {
      success: true,
      orderId: newOrder.id,
    }

  } catch (error) {
    console.error("🔴 Unexpected error in submitOrder:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "שגיאה לא צפויה. אנא נסה שוב." 
    }
  }
}

async function sendNotifications(order: any, orderData: any, userAgent: string, isMobile: boolean) {
  console.log("🔥 === NOTIFICATION START ===")
  const getBaseUrl = () => "https://maccabistickers.vercel.app"
  
  try {
    const baseUrl = getBaseUrl()
    const notificationUrl = `${baseUrl}/api/whatsapp`
    const notificationPayload = {
      orderId: order.id,
      customerName: orderData.customer_name,
      totalPrice: orderData.total_amount,
      paymentMethod: orderData.payment_method,
      phone: orderData.customer_phone,
      isMobile,
    }
    
    await fetch(notificationUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": userAgent },
      body: JSON.stringify(notificationPayload),
    })
    console.log("✅ WhatsApp notification sent")
  } catch (error) {
    console.error("❌ Failed to send WhatsApp notification:", error)
  }
  
  try {
    const baseUrl = getBaseUrl()
    const browserNotificationUrl = `${baseUrl}/api/notifications`
    await fetch(browserNotificationUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        customerName: orderData.customer_name,
        totalPrice: orderData.total_amount,
        paymentMethod: orderData.payment_method,
      }),
    })
    console.log("✅ Browser notification sent")
  } catch (error) {
    console.error("❌ Failed to send browser notification:", error)
  }
  console.log("🔥 === NOTIFICATION END ===")
}

export async function confirmOrder(orderId: string) {
  const supabase = getServerActionClient()
  try {
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("quantity, products(id, stock)")
      .eq("order_id", orderId)
    if (itemsError || !items) return { success: false, error: "Could not fetch order items." }
    for (const item of items) {
      if (item.products && item.products.stock < item.quantity) {
        return { success: false, error: `אין מספיק במלאי עבור מוצר ${item.products.id}.` }
      }
    }
    for (const item of items) {
      if (item.products) {
        const newStock = item.products.stock - item.quantity
        const { error: stockError } = await supabase.from("products").update({ stock: newStock }).eq("id", item.products.id)
        if (stockError) return { success: false, error: `Failed to update stock for product ${item.products.id}` }
      }
    }
    const { error: orderError } = await supabase.from("orders").update({ status: "confirmed" }).eq("id", orderId)
    if (orderError) return { success: false, error: "Failed to update order status." }
    revalidatePath("/admin/orders")
    revalidatePath("/shop")
    return { success: true }
  } catch (error) {
    console.error("Error confirming order:", error)
    return { success: false, error: "שגיאה באישור ההזמנה" }
  }
}

export async function rejectOrder(orderId: string) {
  const supabase = getServerActionClient()
  try {
    const { error } = await supabase.from("orders").update({ status: "rejected" }).eq("id", orderId)
    if (error) return { success: false, error: "Failed to reject order" }
    revalidatePath("/admin/orders")
    return { success: true }
  } catch (error) {
    console.error("Error rejecting order:", error)
    return { success: false, error: "שגיאה בדחיית ההזמנה" }
  }
}

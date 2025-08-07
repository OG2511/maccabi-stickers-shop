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

  // First, validate stock availability for all items
  for (const item of cart) {
    const { data: product, error } = await supabase.from("products").select("stock").eq("id", item.product.id).single()

    if (error || !product) {
      return { success: false, error: `Product ${item.product.name} not found.` }
    }

    if (product.stock < item.quantity) {
      return {
        success: false,
        error: `אין מספיק במלאי עבור ${item.product.name}. יש במלאי רק ${product.stock} יחידות.`,
      }
    }
  }

  // Validate payment method
  const paymentMethod = formData.get("paymentMethod") as string
  const validPaymentMethods = ["bit", "paypal", "paybox"]

  if (!validPaymentMethods.includes(paymentMethod)) {
    return { success: false, error: "Invalid payment method selected." }
  }

  const orderData = {
    customer_name: formData.get("fullName") as string,
    phone: formData.get("phone") as string,
    delivery_option: formData.get("deliveryOption") as "self_pickup" | "israel_post",
    payment_method: paymentMethod as "bit" | "paypal" | "paybox",
    city: formData.get("city") as string | null,
    street: formData.get("street") as string | null,
    house_number: formData.get("houseNumber") as string | null,
    zip_code: formData.get("zipCode") as string | null,
    total_price: totalPrice,
    status: "pending" as const,
  }

  console.log("🟢 Order data:", orderData)

  // 1. Create the order
  const { data: newOrder, error: orderError } = await supabase.from("orders").insert(orderData).select().single()

  if (orderError || !newOrder) {
    console.error("🔴 Supabase order error:", orderError)
    return { success: false, error: "Failed to create order." }
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
    // Optionally, delete the created order to avoid orphans
    await supabase.from("orders").delete().match({ id: newOrder.id })
    return { success: false, error: "Failed to save order items." }
  }

  console.log("🟢 Order items created successfully")

  // 3. Send WhatsApp notification about new order with mobile retry
  console.log("🔥 === NOTIFICATION DEBUG START ===")
  console.log("📱 Attempting to send WhatsApp notification...")
  console.log("📱 Environment check before sending:")
  console.log("📱 ADMIN_WHATSAPP_NUMBER:", process.env.ADMIN_WHATSAPP_NUMBER || "❌ MISSING")
  console.log("📱 CALLMEBOT_API_KEY:", process.env.CALLMEBOT_API_KEY || "❌ MISSING")
  console.log("📱 VERCEL_URL:", process.env.VERCEL_URL || "not set")
  console.log("📱 NEXT_PUBLIC_SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL || "not set")
  console.log("🔥 === NOTIFICATION DEBUG END ===")

  // Fixed URL construction function
  const getBaseUrl = () => {
    // Always use the production URL for notifications
    return "https://maccabistickers.vercel.app"
  }

  let notificationSuccess = false
  const maxRetries = isMobile ? 3 : 1

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📱 Notification attempt ${attempt}/${maxRetries} (mobile: ${isMobile})`)

      const baseUrl = getBaseUrl()
      const notificationUrl = `${baseUrl}/api/whatsapp`

      console.log("📱 Base URL:", baseUrl)
      console.log("📱 Notification URL:", notificationUrl)

      const notificationPayload = {
        orderId: newOrder.id,
        customerName: orderData.customer_name,
        totalPrice: orderData.total_price,
        paymentMethod: orderData.payment_method,
        phone: orderData.phone,
        isMobile,
        attempt,
      }

      console.log("📱 Notification payload:", {
        orderId: newOrder.id.slice(-8),
        customerName: orderData.customer_name,
        totalPrice: orderData.total_price,
        paymentMethod: orderData.payment_method,
        isMobile,
        attempt,
      })

      const controller = new AbortController()
      const timeoutId = setTimeout(
        () => {
          console.log(`⏰ Timeout reached for attempt ${attempt}`)
          controller.abort()
        },
        isMobile ? 20000 : 15000,
      ) // Increased timeout

      console.log("🚀 About to make fetch request...")

      const response = await fetch(notificationUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": userAgent,
        },
        body: JSON.stringify(notificationPayload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log(`📱 Attempt ${attempt} - Response received!`)
      console.log(`📱 Attempt ${attempt} - Response status:`, response.status)
      console.log(`📱 Attempt ${attempt} - Response ok:`, response.ok)

      let responseText = ""
      try {
        responseText = await response.text()
        console.log(`📱 Attempt ${attempt} - Response body:`, responseText)
      } catch (textError) {
        console.error(`📱 Attempt ${attempt} - Error reading response:`, textError)
      }

      if (response.ok) {
        console.log(`✅ WhatsApp notification sent successfully on attempt ${attempt}`)
        notificationSuccess = true
        break
      } else {
        console.error(`❌ Attempt ${attempt} failed:`, {
          status: response.status,
          statusText: response.statusText,
          body: responseText,
        })
        if (attempt < maxRetries) {
          const delay = 2000 * attempt
          console.log(`⏳ Waiting ${delay}ms before retry...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    } catch (error) {
      console.error(`❌ Attempt ${attempt} network error:`, {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : "Unknown error",
        cause: error instanceof Error ? error.cause : undefined,
        stack: error instanceof Error ? error.stack : undefined,
      })

      if (attempt < maxRetries) {
        const delay = 2000 * attempt
        console.log(`⏳ Waiting ${delay}ms before retry after error...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  if (!notificationSuccess) {
    console.error("❌ All notification attempts failed")
    console.log("📊 Final notification status:", {
      orderId: newOrder.id.slice(-8),
      attempts: maxRetries,
      isMobile,
      hasEnvVars: {
        phone: !!process.env.ADMIN_WHATSAPP_NUMBER,
        apiKey: !!process.env.CALLMEBOT_API_KEY,
      },
    })
  }

  // 4. Also send browser notification (with fixed URL) - but don't let it fail the order
  try {
    console.log("🔔 Attempting to send browser notification...")

    const baseUrl = getBaseUrl()
    const browserNotificationUrl = `${baseUrl}/api/notifications`

    console.log("🔔 Browser notification URL:", browserNotificationUrl)

    const browserResponse = await fetch(browserNotificationUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: newOrder.id,
        customerName: orderData.customer_name,
        totalPrice: orderData.total_price,
        paymentMethod: orderData.payment_method,
      }),
    })

    console.log("🔔 Browser notification response:", browserResponse.status)
    if (browserResponse.ok) {
      console.log("✅ Browser notification sent")
    } else {
      console.log("❌ Browser notification failed:", browserResponse.statusText)
    }
  } catch (error) {
    console.error("❌ Failed to send browser notification:", error)
    // Don't fail the order if notification fails
  }

  console.log("✅ Order completed successfully")
  revalidatePath("/admin/orders")

  return {
    success: true,
    orderId: newOrder.id,
  }
}

export async function confirmOrder(orderId: string) {
  const supabase = getServerActionClient()

  // 1. Fetch order items with current product stock
  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("quantity, products(id, stock)")
    .eq("order_id", orderId)

  if (itemsError || !items) {
    return { success: false, error: "Could not fetch order items." }
  }

  // 2. Validate stock availability before confirming
  for (const item of items) {
    if (item.products) {
      if (item.products.stock < item.quantity) {
        return {
          success: false,
          error: `אין מספיק במלאי עבור מוצר ${item.products.id}. יש במלאי רק ${item.products.stock} יחידות.`,
        }
      }
    }
  }

  // 3. Update stock for each product
  for (const item of items) {
    if (item.products) {
      const newStock = item.products.stock - item.quantity
      const { error: stockError } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", item.products.id)

      if (stockError) {
        return { success: false, error: `Failed to update stock for product ${item.products.id}` }
      }
    }
  }

  // 4. Update order status
  const { error: orderError } = await supabase.from("orders").update({ status: "confirmed" }).eq("id", orderId)

  if (orderError) {
    return { success: false, error: "Failed to update order status." }
  }

  revalidatePath("/admin/orders")
  revalidatePath("/shop")
  return { success: true }
}

export async function rejectOrder(orderId: string) {
  console.log("🔴 Starting rejectOrder for ID:", orderId)
  const supabase = getServerActionClient()

  const { error } = await supabase.from("orders").update({ status: "rejected" }).eq("id", orderId)

  if (error) {
    console.error("🔴 Error rejecting order:", error)
    return { success: false, error: "Failed to reject order" }
  }

  console.log("✅ Order rejected successfully")
  revalidatePath("/admin/orders")
  return { success: true }
}

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

    // Check the actual column names in the orders table first
    console.log("🔍 Checking orders table structure...")
    
    const orderData = {
      customer_name: fullName,
      customer_phone: phone, // Changed from 'phone' to 'customer_phone'
      delivery_option: deliveryOption as "self_pickup" | "israel_post",
      payment_method: paymentMethod as "bit" | "paypal" | "paybox",
      city: (formData.get("city") as string) || null,
      street: (formData.get("street") as string) || null,
      house_number: (formData.get("houseNumber") as string) || null,
      zip_code: (formData.get("zipCode") as string) || null,
      total_price: totalPrice,
      status: "pending" as const,
    }

    console.log("🟢 Order data prepared:", {
      ...orderData,
      customer_phone: orderData.customer_phone.substring(0, 3) + "***" // Hide phone for security
    })

    // 1. Create the order
    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single()

    if (orderError || !newOrder) {
      console.error("🔴 Supabase order error:", orderError)
      
      // If it's a column name issue, try with alternative column names
      if (orderError?.message?.includes('customer_phone')) {
        console.log("🔄 Trying with 'phone' column name...")
        const alternativeOrderData = {
          ...orderData,
          phone: orderData.customer_phone,
        }
        delete alternativeOrderData.customer_phone
        
        const { data: newOrderAlt, error: orderErrorAlt } = await supabase
          .from("orders")
          .insert(alternativeOrderData)
          .select()
          .single()
          
        if (orderErrorAlt || !newOrderAlt) {
          console.error("🔴 Alternative order creation failed:", orderErrorAlt)
          return { success: false, error: "שגיאה ביצירת ההזמנה. אנא נסה שוב." }
        }
        
        console.log("🟢 Order created with alternative structure, ID:", newOrderAlt.id)
        // Continue with the alternative order
        const finalOrder = newOrderAlt
        
        // 2. Create order items
        const orderItems = cart.map((item) => ({
          order_id: finalOrder.id,
          product_id: item.product.id,
          quantity: item.quantity,
          price_per_item: item.product.price,
        }))

        const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

        if (itemsError) {
          console.error("🔴 Supabase order items error:", itemsError)
          // Try to delete the created order to avoid orphans
          await supabase.from("orders").delete().match({ id: finalOrder.id })
          return { success: false, error: "שגיאה בשמירת פריטי ההזמנה. אנא נסה שוב." }
        }

        console.log("🟢 Order items created successfully")
        
        // Continue with notifications...
        await sendNotifications(finalOrder, orderData, userAgent, isMobile)
        
        console.log("✅ Order completed successfully")
        revalidatePath("/admin/orders")

        return {
          success: true,
          orderId: finalOrder.id,
        }
      }
      
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
      // Try to delete the created order to avoid orphans
      await supabase.from("orders").delete().match({ id: newOrder.id })
      return { success: false, error: "שגיאה בשמירת פריטי ההזמנה. אנא נסה שוב." }
    }

    console.log("🟢 Order items created successfully")

    // 3. Send notifications
    await sendNotifications(newOrder, orderData, userAgent, isMobile)

    console.log("✅ Order completed successfully")
    revalidatePath("/admin/orders")

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

// Helper function for sending notifications
async function sendNotifications(order: any, orderData: any, userAgent: string, isMobile: boolean) {
  // 3. Send WhatsApp notification about new order with mobile retry
  console.log("🔥 === NOTIFICATION DEBUG START ===")
  console.log("📱 Attempting to send WhatsApp notification...")
  console.log("📱 Environment check before sending:")
  console.log("📱 ADMIN_WHATSAPP_NUMBER:", process.env.ADMIN_WHATSAPP_NUMBER || "❌ MISSING")
  console.log("📱 CALLMEBOT_API_KEY:", process.env.CALLMEBOT_API_KEY || "❌ MISSING")
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

      const notificationPayload = {
        orderId: order.id,
        customerName: orderData.customer_name,
        totalPrice: orderData.total_price,
        paymentMethod: orderData.payment_method,
        phone: orderData.customer_phone || orderData.phone,
        isMobile,
        attempt,
      }

      console.log("📱 Notification payload:", {
        orderId: order.id.slice(-8),
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
      )

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

      console.log(`📱 Attempt ${attempt} - Response status:`, response.status)

      if (response.ok) {
        console.log(`✅ WhatsApp notification sent successfully on attempt ${attempt}`)
        notificationSuccess = true
        break
      } else {
        console.error(`❌ Attempt ${attempt} failed:`, response.status, response.statusText)
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
  }

  // 4. Also send browser notification - but don't let it fail the order
  try {
    const baseUrl = getBaseUrl()
    const browserNotificationUrl = `${baseUrl}/api/notifications`

    const browserResponse = await fetch(browserNotificationUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        customerName: orderData.customer_name,
        totalPrice: orderData.total_price,
        paymentMethod: orderData.payment_method,
      }),
    })

    if (browserResponse.ok) {
      console.log("✅ Browser notification sent")
    } else {
      console.log("❌ Browser notification failed:", browserResponse.statusText)
    }
  } catch (error) {
    console.error("❌ Failed to send browser notification:", error)
    // Don't fail the order if notification fails
  }
}

export async function confirmOrder(orderId: string) {
  const supabase = getServerActionClient()

  try {
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
  } catch (error) {
    console.error("Error confirming order:", error)
    return { success: false, error: "שגיאה באישור ההזמנה" }
  }
}

export async function rejectOrder(orderId: string) {
  console.log("🔴 Starting rejectOrder for ID:", orderId)
  const supabase = getServerActionClient()

  try {
    const { error } = await supabase.from("orders").update({ status: "rejected" }).eq("id", orderId)

    if (error) {
      console.error("🔴 Error rejecting order:", error)
      return { success: false, error: "Failed to reject order" }
    }

    console.log("✅ Order rejected successfully")
    revalidatePath("/admin/orders")
    return { success: true }
  } catch (error) {
    console.error("Error rejecting order:", error)
    return { success: false, error: "שגיאה בדחיית ההזמנה" }
  }
}

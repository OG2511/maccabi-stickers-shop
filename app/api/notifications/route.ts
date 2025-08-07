import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

// יצירת סינגלטון עבור Supabase client בצד השרת
let supabaseServerClient: any = null

function getSupabaseClient() {
  if (supabaseServerClient) {
    return supabaseServerClient
  }

  // בדיקה שמשתני הסביבה קיימים
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables")
  }

  // יצירת מופע חדש רק אם אין כבר אחד
  supabaseServerClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  )

  console.log("🔧 Server Supabase client created (singleton)")
  return supabaseServerClient
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, customerName, totalPrice, paymentMethod } = body

    // Send notification to admin
    const notificationData = {
      title: "🛒 הזמנה חדשה התקבלה!",
      body: `${customerName} הזמין/ה עבור ₪${totalPrice} (${paymentMethod})`,
      icon: "/logo.png",
      badge: "/logo.png",
      tag: `order-${orderId}`,
      data: {
        orderId,
        url: `/admin/orders/${orderId}`,
        type: "new-order",
      },
    }

    // Here you can integrate with push notification services
    // For now, we'll just log it
    console.log("📱 New order notification:", notificationData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending notification:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}

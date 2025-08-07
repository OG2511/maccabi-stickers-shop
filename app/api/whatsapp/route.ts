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
    const { orderId, customerName, totalPrice, paymentMethod, phone, testPhone, testApiKey, isMobile, attempt } = body

    console.log("🔥 === WHATSAPP API DETAILED DEBUG ===")
    console.log("🔥 Request body:", JSON.stringify(body, null, 2))
    console.log("🔥 Environment variables:")
    console.log("🔥   ADMIN_WHATSAPP_NUMBER:", process.env.ADMIN_WHATSAPP_NUMBER || "❌ MISSING")
    console.log("🔥   CALLMEBOT_API_KEY:", process.env.CALLMEBOT_API_KEY || "❌ MISSING")
    console.log("🔥   NODE_ENV:", process.env.NODE_ENV)
    console.log("🔥   VERCEL_URL:", process.env.VERCEL_URL || "not set")
    console.log("🔥 === END DEBUG INFO ===")

    // Rest of the existing code remains the same...
    console.log("📱 WhatsApp API called with:", {
      orderId: orderId?.slice(-8),
      customerName,
      totalPrice,
      paymentMethod,
      isMobile: !!isMobile,
      attempt: attempt || 1,
    })
    console.log("📱 Test mode:", { testPhone: !!testPhone, testApiKey: !!testApiKey })

    // WhatsApp message template
    const message = `🛒 *הזמנה חדשה התקבלה!*

👤 *לקוח:* ${customerName}
💰 *סכום:* ₪${totalPrice}
💳 *תשלום:* ${paymentMethod}
📱 *טלפון:* ${phone}
🔗 *מספר הזמנה:* #${orderId.slice(-8)}
${isMobile ? "📱 *מובייל*" : "💻 *מחשב*"}

📋 *לפרטים מלאים:*
https://maccabistickers.vercel.app/admin/orders/${orderId}

⏰ ${new Date().toLocaleString("he-IL")}`

    // Use test credentials if provided, otherwise use environment variables
    const whatsappPhone = testPhone || process.env.ADMIN_WHATSAPP_NUMBER
    const apiKey = testApiKey || process.env.CALLMEBOT_API_KEY

    console.log("📱 Environment variables check:")
    console.log("📱 ADMIN_WHATSAPP_NUMBER exists:", !!process.env.ADMIN_WHATSAPP_NUMBER)
    console.log("📱 CALLMEBOT_API_KEY exists:", !!process.env.CALLMEBOT_API_KEY)
    console.log("📱 Using phone:", whatsappPhone)
    console.log("📱 Using API Key:", apiKey ? "***" + apiKey.slice(-3) : "not provided")

    if (!whatsappPhone || !apiKey) {
      console.error("❌ Missing WhatsApp credentials")
      console.error("❌ whatsappPhone:", whatsappPhone)
      console.error("❌ apiKey:", apiKey ? "exists" : "missing")
      return NextResponse.json(
        {
          error: "Missing WhatsApp credentials",
          details: {
            hasPhone: !!whatsappPhone,
            hasApiKey: !!apiKey,
            envPhone: !!process.env.ADMIN_WHATSAPP_NUMBER,
            envApiKey: !!process.env.CALLMEBOT_API_KEY,
            testMode: !!testPhone,
          },
        },
        { status: 400 },
      )
    }

    // Clean phone number
    const cleanPhone = whatsappPhone.replace(/[^\d+]/g, "")
    console.log("📱 Clean phone:", cleanPhone)

    // Validate phone number format
    if (!cleanPhone.startsWith("+")) {
      console.error("❌ Invalid phone format:", cleanPhone)
      return NextResponse.json(
        {
          error: "Invalid phone number format",
          details: { phone: cleanPhone, expected: "+972XXXXXXXXX" },
        },
        { status: 400 },
      )
    }

    // Send to WhatsApp using CallMeBot API
    const whatsappUrl = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`

    console.log("🔗 CallMeBot URL (masked):", whatsappUrl.replace(apiKey, "***").substring(0, 150) + "...")

    try {
      // Try to send the message with longer timeout for mobile
      const timeoutMs = isMobile ? 15000 : 10000
      const response = await fetch(whatsappUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; WhatsApp-Bot/1.0)",
        },
        signal: AbortSignal.timeout(timeoutMs),
      })

      console.log("📱 CallMeBot response status:", response.status)

      const responseText = await response.text()
      console.log("📱 CallMeBot response:", responseText)

      // Check if the response indicates success
      const isSuccess = response.ok || response.status === 0 || responseText.includes("Message queued")

      if (isSuccess) {
        console.log("✅ WhatsApp notification sent successfully")

        // Also log to a file or database for tracking
        console.log("📊 NOTIFICATION_SUCCESS:", {
          orderId: orderId.slice(-8),
          timestamp: new Date().toISOString(),
          phone: cleanPhone,
          customer: customerName,
          testMode: !!testPhone,
          isMobile: !!isMobile,
          attempt: attempt || 1,
        })

        return NextResponse.json({
          success: true,
          message: "WhatsApp notification sent",
          debug: {
            phone: cleanPhone,
            responseStatus: response.status,
            responseText: responseText,
            timestamp: new Date().toISOString(),
            testMode: !!testPhone,
            isMobile: !!isMobile,
            attempt: attempt || 1,
          },
        })
      } else {
        console.error("❌ CallMeBot API error:", response.status, responseText)

        // Log failure for debugging
        console.log("📊 NOTIFICATION_FAILED:", {
          orderId: orderId.slice(-8),
          timestamp: new Date().toISOString(),
          error: `Status: ${response.status}, Response: ${responseText}`,
          phone: cleanPhone,
          testMode: !!testPhone,
          isMobile: !!isMobile,
          attempt: attempt || 1,
        })

        return NextResponse.json(
          {
            error: "CallMeBot API error",
            details: {
              status: response.status,
              response: responseText,
              phone: cleanPhone,
              isMobile: !!isMobile,
              attempt: attempt || 1,
            },
          },
          { status: 500 },
        )
      }
    } catch (fetchError) {
      console.error("❌ Network error calling CallMeBot:", fetchError)

      // Log network error
      console.log("📊 NOTIFICATION_NETWORK_ERROR:", {
        orderId: orderId.slice(-8),
        timestamp: new Date().toISOString(),
        error: fetchError instanceof Error ? fetchError.message : "Unknown error",
        phone: cleanPhone,
        testMode: !!testPhone,
        isMobile: !!isMobile,
        attempt: attempt || 1,
      })

      return NextResponse.json(
        {
          error: "Network error",
          details: {
            error: fetchError instanceof Error ? fetchError.message : "Unknown error",
            isMobile: !!isMobile,
            attempt: attempt || 1,
          },
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ WhatsApp API error:", error)
    return NextResponse.json(
      {
        error: "WhatsApp API error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

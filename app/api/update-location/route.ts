import { NextResponse, type NextRequest } from "next/server"
import { getServerSupabaseClient } from "@/lib/supabase/server-singleton"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, latitude, longitude, city, country, currentPage, cartItems } = body

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session ID" }, { status: 400 })
    }

    const userAgent = request.headers.get("user-agent") || ""
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)

    console.log("📱 Location update request:", {
      sessionId: sessionId.slice(-8),
      isMobile,
      hasLocation: !!(latitude && longitude),
      currentPage,
      cartItemsCount: cartItems?.length || 0,
      userAgent: userAgent.substring(0, 50) + "...",
    })

    // השתמש בפונקציה שיוצרת סינגלטון
    const supabase = getServerSupabaseClient()

    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "127.0.0.1"

    // Prepare the data for upsert
    const updateData = {
      session_id: sessionId,
      latitude: latitude ? Number.parseFloat(latitude) : null,
      longitude: longitude ? Number.parseFloat(longitude) : null,
      city: city || null,
      country: country || null,
      user_agent: userAgent,
      ip_address: ip,
      last_seen: new Date().toISOString(),
      current_page: currentPage || null,
      cart_items: cartItems || null,
    }

    console.log("📱 Updating database for mobile:", {
      sessionId: sessionId.slice(-8),
      isMobile,
      hasData: Object.values(updateData).some((v) => v !== null),
    })

    // Use upsert for better performance
    const { error } = await supabase.from("active_users").upsert(updateData, {
      onConflict: "session_id",
      ignoreDuplicates: false,
    })

    if (error) {
      console.error("📱 Mobile database error:", error)
      return NextResponse.json({ error: "Failed to update location" }, { status: 500 })
    }

    console.log("✅ Mobile location updated successfully")

    // Clean up inactive users less frequently (every 10th request)
    if (Math.random() < 0.1) {
      try {
        await supabase.rpc("cleanup_inactive_users")
      } catch (cleanupError) {
        // Don't fail the main request if cleanup fails
        console.warn("Cleanup failed:", cleanupError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

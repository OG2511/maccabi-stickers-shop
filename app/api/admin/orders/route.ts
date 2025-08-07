import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const cookieStore = cookies()
    const isAuthenticated = cookieStore.get("admin_authenticated")?.value === "true"

    console.log("🔐 Admin auth check:", {
      isAuthenticated,
      nodeEnv: process.env.NODE_ENV,
      cookieValue: cookieStore.get("admin_authenticated")?.value,
    })

    if (!isAuthenticated && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "נדרש אימות מנהל" }, { status: 401 })
    }

    const supabase = createClient()

    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          quantity,
          price_per_item,
          products (
            id,
            name,
            price,
            image_url,
            stock,
            collection
          )
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    return NextResponse.json(orders || [])
  } catch (error) {
    console.error("Error in orders API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

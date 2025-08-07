import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// Helper function to check admin authentication
async function checkAdminAuth() {
  const cookieStore = cookies()
  const adminSession = cookieStore.get("admin_session")

  if (adminSession) {
    console.log("🔑 Admin session verified:", adminSession.value)
    return true
  }

  // Fallback to Supabase auth
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    console.log("🔑 Supabase user verified:", user.id)
    return true
  }

  console.log("🔑 No valid authentication found")
  return false
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔴 DELETE API: Starting product deletion")

    // Check authentication
    const isAuthenticated = await checkAdminAuth()
    if (!isAuthenticated) {
      console.log("🔴 DELETE API: Authentication failed")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Get product ID from request
    const { productId } = await request.json()

    if (!productId) {
      console.log("🔴 DELETE API: No product ID provided")
      return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 })
    }

    console.log("🔴 DELETE API: Deleting product ID:", productId)

    // Create Supabase client
    const supabase = createClient()

    // Delete the product
    const { error, data } = await supabase.from("products").delete().eq("id", productId).select()

    if (error) {
      console.error("🔴 DELETE API: Supabase error:", error)
      return NextResponse.json({ success: false, error: "Failed to delete product from database" }, { status: 500 })
    }

    if (!data || data.length === 0) {
      console.log("🔴 DELETE API: Product not found")
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 })
    }

    console.log("✅ DELETE API: Product deleted successfully:", data[0])

    // Revalidate relevant paths
    try {
      revalidatePath("/admin/products")
      revalidatePath("/shop")
      revalidatePath("/")
      console.log("✅ DELETE API: Paths revalidated")
    } catch (revalidateError) {
      console.warn("⚠️ DELETE API: Revalidation warning:", revalidateError)
      // Don't fail the request if revalidation fails
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
      deletedProduct: data[0],
    })
  } catch (error) {
    console.error("🔴 DELETE API: Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

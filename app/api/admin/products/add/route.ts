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
    console.log("🔵 ADD API: Starting product addition")

    // Check authentication
    const isAuthenticated = await checkAdminAuth()
    if (!isAuthenticated) {
      console.log("🔵 ADD API: Authentication failed")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Get product data from request
    const productData = await request.json()
    console.log("🔵 ADD API: Product data received:", productData)

    // Validate required fields
    if (!productData.name || !productData.price || !productData.collection || productData.stock === undefined) {
      console.log("🔵 ADD API: Missing required fields")
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Validate data types
    if (typeof productData.price !== "number" || productData.price <= 0) {
      console.log("🔵 ADD API: Invalid price")
      return NextResponse.json({ success: false, error: "Price must be a positive number" }, { status: 400 })
    }

    if (typeof productData.stock !== "number" || productData.stock < 0) {
      console.log("🔵 ADD API: Invalid stock")
      return NextResponse.json({ success: false, error: "Stock must be a non-negative number" }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createClient()

    // Insert the product
    const { error, data } = await supabase
      .from("products")
      .insert({
        name: productData.name.trim(),
        price: productData.price,
        collection: productData.collection,
        stock: productData.stock,
        image_url: productData.image_url || null,
      })
      .select()

    if (error) {
      console.error("🔵 ADD API: Supabase error:", error)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to add product: ${error.message}`,
        },
        { status: 500 },
      )
    }

    if (!data || data.length === 0) {
      console.log("🔵 ADD API: No data returned")
      return NextResponse.json({ success: false, error: "Failed to create product" }, { status: 500 })
    }

    console.log("✅ ADD API: Product added successfully:", data[0])

    // Revalidate relevant paths
    try {
      revalidatePath("/admin/products")
      revalidatePath("/shop")
      revalidatePath("/")
      console.log("✅ ADD API: Paths revalidated")
    } catch (revalidateError) {
      console.warn("⚠️ ADD API: Revalidation warning:", revalidateError)
      // Don't fail the request if revalidation fails
    }

    return NextResponse.json({
      success: true,
      message: "Product added successfully",
      product: data[0],
    })
  } catch (error) {
    console.error("🔵 ADD API: Unexpected error:", error)
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

"use server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

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

// Update the deleteOrderAction to return a result instead of redirecting
export async function deleteOrderAction(formData: FormData) {
  const orderId = formData.get("orderId") as string
  console.log("🔴 Starting deleteOrderAction for ID:", orderId)

  const isAuthenticated = await checkAdminAuth()
  if (!isAuthenticated) {
    return { success: false, error: "Authentication required" }
  }

  const supabase = createClient()

  console.log("🔴 Attempting to delete order with ID:", orderId)

  // Delete the order (order_items will be deleted automatically due to CASCADE)
  const { error: deleteError, data: deleteResult } = await supabase.from("orders").delete().eq("id", orderId).select()

  if (deleteError) {
    console.error("🔴 Supabase delete error:", deleteError)
    return { success: false, error: "Failed to delete order" }
  }

  console.log("✅ Delete operation completed")
  console.log("🔴 Delete result:", deleteResult)

  return { success: true }
}

// Add this new function at the end of the file

export async function bulkDeleteOrdersAction(formData: FormData) {
  const orderIdsJson = formData.get("orderIds") as string
  const orderIds = JSON.parse(orderIdsJson) as string[]

  console.log("🔴 Starting bulkDeleteOrdersAction for IDs:", orderIds)

  const isAuthenticated = await checkAdminAuth()
  if (!isAuthenticated) {
    return { success: false, error: "Authentication required" }
  }

  const supabase = createClient()

  try {
    // Delete all orders in one query
    const { error: deleteError, data: deleteResult } = await supabase
      .from("orders")
      .delete()
      .in("id", orderIds)
      .select()

    if (deleteError) {
      console.error("🔴 Supabase bulk delete error:", deleteError)
      return { success: false, error: "Failed to delete orders" }
    }

    console.log("✅ Bulk delete operation completed")
    console.log("🔴 Deleted orders count:", deleteResult?.length || 0)

    // Add a small delay to ensure the deletion is fully processed
    await new Promise((resolve) => setTimeout(resolve, 100))

    return { success: true, deletedCount: deleteResult?.length || 0 }
  } catch (error) {
    console.error("🔴 Bulk delete exception:", error)
    return { success: false, error: "Failed to delete orders" }
  }
}

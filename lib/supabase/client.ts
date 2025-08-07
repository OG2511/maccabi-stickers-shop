import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// משתנה גלובלי לאחסון מופע יחיד של ה-client
let supabaseClient: SupabaseClient | undefined = undefined

/**
 * יוצר או מחזיר את מופע ה-Supabase client הקיים
 * מבטיח שיש רק מופע אחד בכל הדפדפן
 */
export function createClient(): SupabaseClient {
  // אם כבר יש מופע, החזר אותו
  if (supabaseClient) {
    return supabaseClient
  }

  // בדוק שמשתני הסביבה קיימים
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables")
  }

  // צור מופע חדש רק אם אין כבר אחד
  supabaseClient = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  console.log("🔧 Supabase client created (singleton)")

  return supabaseClient
}

// פונקציה לניקוי המופע (לשימוש בפיתוח בלבד)
export function resetClient() {
  if (process.env.NODE_ENV === "development") {
    supabaseClient = undefined
    console.log("🔧 Supabase client reset")
  }
}

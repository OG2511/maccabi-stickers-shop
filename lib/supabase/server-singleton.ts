import { createServerClient } from "@supabase/ssr"

// יצירת סינגלטון עבור Supabase client בצד השרת
let supabaseServerClient: any = null

export function getServerSupabaseClient() {
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

// פונקציה לניקוי המופע (לשימוש בפיתוח בלבד)
export function resetServerClient() {
  if (process.env.NODE_ENV === "development") {
    supabaseServerClient = undefined
    console.log("🔧 Server Supabase client reset")
  }
}

"use client"

import { useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Hook לשימוש ב-Supabase client בקומפוננטות React
 * מבטיח שהמופע נוצר רק פעם אחת לכל קומפוננטה
 */
export function useSupabase(): SupabaseClient {
  const supabase = useMemo(() => {
    console.log("🔧 useSupabase: Creating client instance")
    return createClient()
  }, [])

  return supabase
}

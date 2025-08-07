"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/hooks/use-supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, MapPin, RefreshCw, ShoppingCart, FileText, Trash2, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { CartItem } from "@/lib/types"

interface ActiveUser {
  id: string
  session_id: string
  latitude: number | null
  longitude: number | null
  city: string | null
  country: string | null
  user_agent: string
  ip_address: string
  last_seen: string
  created_at: string
  current_page: string | null
  cart_items: CartItem[] | null
}

export default function UsersPage() {
  const supabase = useSupabase()
  const [users, setUsers] = useState<ActiveUser[]>([])
  const [loading, setLoading] = useState(true)
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const { toast } = useToast()

  const loadUsers = async () => {
    try {
      // Auto cleanup on every load
      await supabase.rpc("cleanup_inactive_users")
      const { data, error } = await supabase.from("active_users").select("*").order("last_seen", { ascending: false })

      if (error) {
        console.error("Error loading users:", error)
        toast({ title: "שגיאה", description: "שגיאה בטעינת המשתמשים", variant: "destructive" })
      } else {
        setUsers(data || [])
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const manualCleanup = async () => {
    setCleanupLoading(true)
    console.log("🧹 Starting manual cleanup...")

    try {
      // Call the cleanup function
      const { data: cleanupResult, error: cleanupError } = await supabase.rpc("cleanup_inactive_users")

      if (cleanupError) {
        console.error("🧹 Cleanup error:", cleanupError)
        toast({
          title: "שגיאה בניקוי",
          description: "שגיאה בניקוי משתמשים לא פעילים",
          variant: "destructive",
        })
      } else {
        console.log("🧹 Cleanup result:", cleanupResult)

        // Reload users after cleanup
        await loadUsers()

        toast({
          title: "ניקוי הושלם",
          description: `${cleanupResult || 0} משתמשים לא פעילים נוקו מהמערכת`,
        })
      }
    } catch (error) {
      console.error("🧹 Cleanup exception:", error)
      toast({
        title: "שגיאה",
        description: "שגיאה בביצוע הניקוי",
        variant: "destructive",
      })
    } finally {
      setCleanupLoading(false)
    }
  }

  const forceCleanupOldSessions = async () => {
    setCleanupLoading(true)
    console.log("🧹 Starting force cleanup of old sessions...")

    try {
      // Delete sessions older than 5 minutes manually
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

      const { data: deletedUsers, error: deleteError } = await supabase
        .from("active_users")
        .delete()
        .lt("last_seen", fiveMinutesAgo)
        .select()

      if (deleteError) {
        console.error("🧹 Force cleanup error:", deleteError)
        toast({
          title: "שגיאה בניקוי כפוי",
          description: "שגיאה בניקוי כפוי של משתמשים ישנים",
          variant: "destructive",
        })
      } else {
        console.log("🧹 Force cleanup result:", deletedUsers)

        // Reload users after cleanup
        await loadUsers()

        toast({
          title: "ניקוי כפוי הושלם",
          description: `${deletedUsers?.length || 0} משתמשים ישנים נמחקו בכוח`,
        })
      }
    } catch (error) {
      console.error("🧹 Force cleanup exception:", error)
      toast({
        title: "שגיאה",
        description: "שגיאה בביצוע ניקוי כפוי",
        variant: "destructive",
      })
    } finally {
      setCleanupLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
    const interval = setInterval(loadUsers, 15000) // Update every 15 seconds
    return () => clearInterval(interval)
  }, [])

  const getDeviceType = (userAgent: string) => (/Mobile|Android|iPhone|iPad/.test(userAgent) ? "📱 מובייל" : "💻 מחשב")
  const getBrowser = (userAgent: string) => {
    if (userAgent.includes("Chrome")) return "Chrome"
    if (userAgent.includes("Firefox")) return "Firefox"
    if (userAgent.includes("Safari")) return "Safari"
    if (userAgent.includes("Edge")) return "Edge"
    return "אחר"
  }
  const getTimeAgo = (dateString: string) => {
    const diffInSeconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000)
    if (diffInSeconds < 60) return `${diffInSeconds} שנ'`
    const minutes = Math.floor(diffInSeconds / 60)
    if (minutes < 60) return `${minutes} דק'`
    const hours = Math.floor(minutes / 60)
    return `${hours} שע'`
  }
  const getPopularCity = (users: ActiveUser[]) => {
    if (users.length === 0) return "אין נתונים"
    const cityCounts: Record<string, number> = {}
    users.forEach((user) => {
      if (user.city) cityCounts[user.city] = (cityCounts[user.city] || 0) + 1
    })
    const entries = Object.entries(cityCounts)
    if (entries.length === 0) return "אין נתונים"
    entries.sort(([, a], [, b]) => b - a)
    return entries[0][0]
  }

  // Filter users by activity (for display purposes)
  const activeUsers = users.filter((user) => {
    const diffInMinutes = Math.floor((new Date().getTime() - new Date(user.last_seen).getTime()) / (1000 * 60))
    return diffInMinutes <= 5
  })

  const inactiveUsers = users.filter((user) => {
    const diffInMinutes = Math.floor((new Date().getTime() - new Date(user.last_seen).getTime()) / (1000 * 60))
    return diffInMinutes > 5
  })

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">ניהול משתמשים</h1>
            <p className="text-muted-foreground">משתמשים פעילים באתר כרגע</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Button onClick={loadUsers} variant="outline" disabled={loading}>
            <RefreshCw className={`ml-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            רענן
          </Button>
          <Button onClick={manualCleanup} variant="outline" disabled={cleanupLoading}>
            <Clock className={`ml-2 h-4 w-4 ${cleanupLoading ? "animate-spin" : ""}`} />
            {cleanupLoading ? "מנקה..." : "נקה לא פעילים"}
          </Button>
          <Button onClick={forceCleanupOldSessions} variant="destructive" disabled={cleanupLoading}>
            <Trash2 className={`ml-2 h-4 w-4 ${cleanupLoading ? "animate-spin" : ""}`} />
            {cleanupLoading ? "מנקה בכוח..." : "ניקוי כפוי"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/orders">ניהול הזמנות</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/products">ניהול מוצרים</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משתמשים פעילים</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeUsers.length}</div>
            <p className="text-xs text-muted-foreground">פעילים ב-5 דקות האחרונות</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משתמשים לא פעילים</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{inactiveUsers.length}</div>
            <p className="text-xs text-muted-foreground">לא פעילים מעל 5 דקות</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">עיר פופולרית</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getPopularCity(activeUsers)}</div>
            <p className="text-xs text-muted-foreground">הכי הרבה משתמשים פעילים</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">עדכון אחרון</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lastUpdate.toLocaleTimeString("he-IL")}</div>
            <p className="text-xs text-muted-foreground">מתעדכן כל 15 שניות</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Users */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            משתמשים פעילים ({activeUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">טוען משתמשים...</div>
          ) : activeUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">אין משתמשים פעילים כרגע</div>
          ) : (
            <div className="space-y-4">
              {activeUsers.map((user) => (
                <div key={user.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-green-50">
                  {/* Location & Device Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {user.city || "לא ידוע"}, {user.country || "לא ידוע"}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getDeviceType(user.user_agent)} • {getBrowser(user.user_agent)} • IP: {user.ip_address}
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      פעיל - נראה לאחרונה: לפני {getTimeAgo(user.last_seen)}
                    </div>
                  </div>
                  {/* Current Page */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-medium">דף נוכחי</span>
                    </div>
                    <div className="text-sm text-muted-foreground truncate" title={user.current_page || ""}>
                      {user.current_page || "לא ידוע"}
                    </div>
                  </div>
                  {/* Cart Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        עגלת קניות ({user.cart_items?.reduce((sum, item) => sum + item.quantity, 0) || 0} פריטים)
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1 max-h-20 overflow-y-auto">
                      {user.cart_items && user.cart_items.length > 0 ? (
                        user.cart_items.map((item) => (
                          <div key={item.product.id} className="flex justify-between text-xs">
                            <span>{item.product.name}</span>
                            <span>x{item.quantity}</span>
                          </div>
                        ))
                      ) : (
                        <span>העגלה ריקה</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inactive Users */}
      {inactiveUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              משתמשים לא פעילים ({inactiveUsers.length})
              <span className="text-sm text-muted-foreground font-normal">- יימחקו בניקוי הבא</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inactiveUsers.map((user) => (
                <div key={user.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-orange-50">
                  {/* Location & Device Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {user.city || "לא ידוע"}, {user.country || "לא ידוע"}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getDeviceType(user.user_agent)} • {getBrowser(user.user_agent)} • IP: {user.ip_address}
                    </div>
                    <div className="text-xs text-orange-600 font-medium">
                      לא פעיל - נראה לאחרונה: לפני {getTimeAgo(user.last_seen)}
                    </div>
                  </div>
                  {/* Current Page */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-medium">דף אחרון</span>
                    </div>
                    <div className="text-sm text-muted-foreground truncate" title={user.current_page || ""}>
                      {user.current_page || "לא ידוע"}
                    </div>
                  </div>
                  {/* Cart Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        עגלת קניות ({user.cart_items?.reduce((sum, item) => sum + item.quantity, 0) || 0} פריטים)
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1 max-h-20 overflow-y-auto">
                      {user.cart_items && user.cart_items.length > 0 ? (
                        user.cart_items.map((item) => (
                          <div key={item.product.id} className="flex justify-between text-xs">
                            <span>{item.product.name}</span>
                            <span>x{item.quantity}</span>
                          </div>
                        ))
                      ) : (
                        <span>העגלה ריקה</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

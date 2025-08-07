"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Bell, BellOff } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function AdminNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check if notifications are supported
    if ("Notification" in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }

    // Check if already subscribed
    const subscribed = localStorage.getItem("admin-notifications") === "true"
    setIsSubscribed(subscribed)
  }, [])

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: "לא נתמך",
        description: "הדפדפן שלך לא תומך בהתראות",
        variant: "destructive",
      })
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission === "granted") {
        setIsSubscribed(true)
        localStorage.setItem("admin-notifications", "true")

        // Test notification
        new Notification("🔔 התראות מופעלות!", {
          body: "תקבל התראה על כל הזמנה חדשה",
          icon: "/logo.png",
        })

        toast({
          title: "התראות מופעלות!",
          description: "תקבל התראה על כל הזמנה חדשה",
        })
      } else {
        toast({
          title: "התראות נדחו",
          description: "לא תקבל התראות על הזמנות חדשות",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      toast({
        title: "שגיאה",
        description: "לא ניתן להפעיל התראות",
        variant: "destructive",
      })
    }
  }

  const disableNotifications = () => {
    setIsSubscribed(false)
    localStorage.setItem("admin-notifications", "false")
    toast({
      title: "התראות כובו",
      description: "לא תקבל יותר התראות על הזמנות",
    })
  }

  if (!isSupported) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {isSubscribed ? (
        <Button
          variant="outline"
          size="sm"
          onClick={disableNotifications}
          className="flex items-center gap-2 bg-transparent"
        >
          <BellOff className="h-4 w-4" />
          כבה התראות
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={requestPermission}
          className="flex items-center gap-2 bg-transparent"
        >
          <Bell className="h-4 w-4" />
          הפעל התראות
        </Button>
      )}
    </div>
  )
}

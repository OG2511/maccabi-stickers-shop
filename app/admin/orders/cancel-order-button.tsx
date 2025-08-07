"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface CancelOrderButtonProps {
  orderId: string
  orderStatus: string
}

export function CancelOrderButton({ orderId, orderStatus }: CancelOrderButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Only show cancel button for confirmed orders
  if (orderStatus !== "confirmed") {
    return null
  }

  const handleCancel = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/orders/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to cancel order")
      }

      toast({
        title: "הצלחה",
        description: "ההזמנה בוטלה בהצלחה",
      })

      // Refresh the page to show updated status
      window.location.reload()
    } catch (error) {
      console.error("Error cancelling order:", error)
      toast({
        title: "שגיאה",
        description: error instanceof Error ? error.message : "שגיאה בביטול ההזמנה",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          <X className="h-4 w-4 mr-1" />
          בטל הזמנה
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>בטל הזמנה</AlertDialogTitle>
          <AlertDialogDescription>
            האם אתה בטוח שברצונך לבטל הזמנה זו? פעולה זו תסמן את ההזמנה כמבוטלת.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel} disabled={loading}>
            {loading ? "מבטל..." : "בטל הזמנה"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

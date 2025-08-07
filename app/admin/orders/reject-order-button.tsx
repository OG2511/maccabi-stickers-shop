"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface RejectOrderButtonProps {
  orderId: string
  onSuccess?: () => void
}

export function RejectOrderButton({ orderId, onSuccess }: RejectOrderButtonProps) {
  const [isRejecting, setIsRejecting] = useState(false)

  const handleReject = async () => {
    try {
      setIsRejecting(true)

      const response = await fetch(`/api/admin/orders/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      alert("ההזמנה נדחתה בהצלחה")

      if (onSuccess && typeof onSuccess === "function") {
        onSuccess()
      }

      // Refresh the page
      window.location.reload()
    } catch (error) {
      console.error("Error rejecting order:", error)
      alert("שגיאה בדחיית ההזמנה")
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <Button onClick={handleReject} variant="destructive" size="sm" disabled={isRejecting}>
      <X className="h-4 w-4" />
      {isRejecting ? "דוחה..." : "דחה"}
    </Button>
  )
}

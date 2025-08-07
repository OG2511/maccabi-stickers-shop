"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

interface ConfirmOrderButtonProps {
  orderId: string
  onSuccess?: () => void
}

export function ConfirmOrderButton({ orderId, onSuccess }: ConfirmOrderButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    try {
      setIsConfirming(true)

      const response = await fetch(`/api/admin/orders/confirm`, {
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

      alert("ההזמנה אושרה בהצלחה")

      if (onSuccess && typeof onSuccess === "function") {
        onSuccess()
      }

      // Refresh the page
      window.location.reload()
    } catch (error) {
      console.error("Error confirming order:", error)
      alert("שגיאה באישור ההזמנה")
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <Button onClick={handleConfirm} variant="default" size="sm" disabled={isConfirming}>
      <Check className="h-4 w-4" />
      {isConfirming ? "מאשר..." : "אשר"}
    </Button>
  )
}

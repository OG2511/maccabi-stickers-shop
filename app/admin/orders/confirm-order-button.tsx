"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check } from 'lucide-react'

interface ConfirmOrderButtonProps {
  orderId: string
  onSuccess?: () => void
}

export function ConfirmOrderButton({ orderId, onSuccess }: ConfirmOrderButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      const response = await fetch(`/api/admin/orders/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to confirm order")
      }

      alert("ההזמנה אושרה בהצלחה")

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error confirming order:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      alert(`שגיאה באישור ההזמנה: ${errorMessage}`)
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <Button onClick={handleConfirm} variant="default" size="sm" disabled={isConfirming}>
      <Check className="ml-2 h-4 w-4" />
      {isConfirming ? "מאשר..." : "אשר הזמנה"}
    </Button>
  )
}

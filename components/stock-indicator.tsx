"use client"

import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface StockIndicatorProps {
  stock: number
  className?: string
  showIcon?: boolean
  showText?: boolean
}

export function StockIndicator({ 
  stock, 
  className = "", 
  showIcon = true, 
  showText = true 
}: StockIndicatorProps) {
  const getStockStatus = () => {
    if (stock <= 0) {
      return {
        variant: "destructive" as const,
        icon: XCircle,
        text: "אזל מהמלאי",
        color: "text-red-600"
      }
    } else if (stock <= 5) {
      return {
        variant: "secondary" as const,
        icon: AlertTriangle,
        text: `נותרו ${stock}`,
        color: "text-orange-600"
      }
    } else {
      return {
        variant: "default" as const,
        icon: CheckCircle,
        text: `במלאי: ${stock}`,
        color: "text-green-600"
      }
    }
  }

  const status = getStockStatus()
  const Icon = status.icon

  return (
    <Badge variant={status.variant} className={`${className} ${status.color}`}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {showText && status.text}
    </Badge>
  )
}

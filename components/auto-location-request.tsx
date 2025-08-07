"use client"

import { useEffect, useRef, useCallback } from "react"
import { useCart } from "@/hooks/use-cart"
import { usePathname } from "next/navigation"

// Add mobile-specific checks
const isMobile = () => {
  if (typeof window === "undefined") return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

const isIOS = () => {
  if (typeof window === "undefined") return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

interface LocationData {
  latitude: number
  longitude: number
  city: string
  country: string
}

interface UpdatePayload {
  sessionId: string
  latitude?: number
  longitude?: number
  city?: string
  country?: string
  currentPage: string
  cartItems: any[]
}

export function AutoLocationRequest() {
  const { cart } = useCart()
  const pathname = usePathname()

  // Refs to store current state
  const locationDataRef = useRef<LocationData | null>(null)
  const lastUpdateRef = useRef<UpdatePayload | null>(null)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isUpdatingRef = useRef(false)
  const retryCountRef = useRef(0)
  const sessionIdRef = useRef<string | null>(null)

  // Initialize session ID
  useEffect(() => {
    let sessionId = sessionStorage.getItem("user_session_id")
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem("user_session_id", sessionId)
    }
    sessionIdRef.current = sessionId
  }, [])

  // Optimized update function with retry logic
  const sendUpdate = useCallback(
    async (immediate = false) => {
      if (!sessionIdRef.current || isUpdatingRef.current) return

      const payload: UpdatePayload = {
        sessionId: sessionIdRef.current,
        latitude: locationDataRef.current?.latitude,
        longitude: locationDataRef.current?.longitude,
        city: locationDataRef.current?.city,
        country: locationDataRef.current?.country,
        currentPage: pathname,
        cartItems: cart,
      }

      // Skip update if nothing changed (unless immediate)
      if (!immediate && lastUpdateRef.current && JSON.stringify(lastUpdateRef.current) === JSON.stringify(payload)) {
        return
      }

      isUpdatingRef.current = true

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // Increased timeout for mobile

        const response = await fetch("/api/update-location", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": navigator.userAgent, // Add user agent for mobile detection
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        // Success - reset retry count and update last payload
        retryCountRef.current = 0
        lastUpdateRef.current = payload

        console.log("📱 Mobile update sent successfully")
      } catch (error: any) {
        console.error("📱 Mobile update error:", error.message)

        // More aggressive retry for mobile
        if (retryCountRef.current < 5 && error.name !== "AbortError") {
          retryCountRef.current++
          const retryDelay = Math.min(2000 * Math.pow(2, retryCountRef.current), 15000)

          setTimeout(() => {
            if (sessionIdRef.current) {
              sendUpdate(true)
            }
          }, retryDelay)
        }
      } finally {
        isUpdatingRef.current = false
      }
    },
    [pathname, cart],
  )

  // Debounced update for cart changes
  const debouncedUpdate = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    updateTimeoutRef.current = setTimeout(() => {
      sendUpdate(true)
    }, 500) // 500ms debounce
  }, [sendUpdate])

  // Handle location request
  useEffect(() => {
    const locationAsked = sessionStorage.getItem("location_asked")

    if (!locationAsked && "geolocation" in navigator) {
      const timer = setTimeout(
        () => {
          const options = {
            enableHighAccuracy: isMobile(), // More accurate for mobile
            timeout: isMobile() ? 15000 : 10000, // Longer timeout for mobile
            maximumAge: isMobile() ? 600000 : 300000, // Longer cache for mobile
          }

          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords
              console.log("📍 Mobile location obtained:", { latitude, longitude })

              try {
                const geoData = await reverseGeocode(latitude, longitude)
                locationDataRef.current = { latitude, longitude, ...geoData }
                sessionStorage.setItem("location_asked", "true")
                sendUpdate(true) // Send immediate update with location
              } catch (error) {
                console.error("📍 Mobile geocoding error:", error)
                sessionStorage.setItem("location_asked", "true")
                sendUpdate(true) // Send update without geocoding
              }
            },
            (error) => {
              console.log("📍 Mobile location denied or error:", error.message)
              sessionStorage.setItem("location_asked", "true")
              sendUpdate(true) // Send update without location
            },
            options,
          )
        },
        isMobile() ? 2000 : 1000,
      ) // Longer delay for mobile

      return () => clearTimeout(timer)
    }
  }, [sendUpdate])

  // Handle cart changes with debouncing
  useEffect(() => {
    if (sessionIdRef.current) {
      debouncedUpdate()
    }
  }, [cart, debouncedUpdate])

  // Handle page changes (immediate update)
  useEffect(() => {
    if (sessionIdRef.current) {
      sendUpdate(true)
    }
  }, [pathname, sendUpdate])

  // Regular interval updates (reduced frequency)
  useEffect(() => {
    if (!sessionIdRef.current) return

    // Set up periodic updates every 30 seconds (reduced from 15)
    intervalRef.current = setInterval(() => {
      sendUpdate(false)
    }, 30000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [sendUpdate])

  // Page visibility API - pause updates when tab is not active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && sessionIdRef.current) {
        // Resume with immediate update when tab becomes visible
        sendUpdate(true)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [sendUpdate])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Optimized reverse geocoding with caching
  const reverseGeocode = async (lat: number, lng: number): Promise<{ city: string; country: string }> => {
    const cacheKey = `geocode_${lat.toFixed(3)}_${lng.toFixed(3)}`
    const cached = sessionStorage.getItem(cacheKey)

    if (cached) {
      return JSON.parse(cached)
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=he`,
        { signal: controller.signal },
      )

      clearTimeout(timeoutId)

      if (!response.ok) throw new Error("Geocoding failed")

      const data = await response.json()
      const result = {
        city: data.city || data.locality || "עיר לא ידועה",
        country: data.countryName || "מדינה לא ידועה",
      }

      // Cache for 1 hour
      sessionStorage.setItem(cacheKey, JSON.stringify(result))
      setTimeout(() => sessionStorage.removeItem(cacheKey), 3600000)

      return result
    } catch (error) {
      console.error("Reverse geocoding error:", error)
      return { city: "עיר לא ידועה", country: "מדינה לא ידועה" }
    }
  }

  return null
}

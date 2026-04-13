"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "./use-auth"

export function useOrganisations() {
  const { user } = useAuth()
  const [organisations, setOrganisations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  // Use centralized Supabase client

  useEffect(() => {
    const fetchOrganisations = async () => {
      if (!user) {
        setOrganisations([])
        setLoading(false)
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) {
          setOrganisations([])
          setLoading(false)
          return
        }

        const response = await fetch("/api/organisations", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) throw new Error("Failed to fetch organisations")

        const result = await response.json()
        setOrganisations(result.organisations ?? [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrganisations()
  }, [user])

  const createOrganisation = async (name: string, plan = "starter") => {
    if (!user) {
      throw new Error("User not authenticated")
    }

    const response = await fetch("/api/organisations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, plan }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to create organisation")
    }

    const result = await response.json()

    // Refresh the organisations list
    setOrganisations((prev) => [...prev, result.organisation])

    return result.organisation
  }

  return {
    organisations,
    loading,
    error,
    createOrganisation,
  }
}

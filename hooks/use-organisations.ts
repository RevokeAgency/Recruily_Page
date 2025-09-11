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
        // Get all organisations the user is a member of
        const { data, error } = await supabase
          .from("members")
          .select(`
            organisation_id,
            role,
            organisations (
              id,
              name,
              plan,
              created_at
            )
          `)
          .eq("user_id", user.id)

        if (error) {
          throw error
        }

        // Transform the data to a more usable format
        const orgs = data.map((item) => ({
          ...item.organisations,
          role: item.role,
        }))

        setOrganisations(orgs)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrganisations()
  }, [user, supabase])

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

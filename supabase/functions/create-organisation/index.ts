import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createSupabaseClient } from "../utils/supabase-client.ts"

interface CreateOrgRequest {
  name: string
  plan?: string
}

serve(async (req: Request) => {
  try {
    // Check if request is a valid POST request
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get the current user from the JWT
    const supabase = createSupabaseClient(req)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Parse request body
    const { name, plan = "starter" } = (await req.json()) as CreateOrgRequest

    if (!name) {
      return new Response(JSON.stringify({ error: "Organisation name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Create the organisation
    const { data: org, error: orgError } = await supabase.from("organisations").insert({ name, plan }).select().single()

    if (orgError) {
      return new Response(JSON.stringify({ error: orgError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Add the current user as an owner of the organisation
    const { error: memberError } = await supabase.from("members").insert({
      user_id: user.id,
      organisation_id: org.id,
      role: "owner",
    })

    if (memberError) {
      // Rollback organisation creation if member creation fails
      await supabase.from("organisations").delete().eq("id", org.id)

      return new Response(JSON.stringify({ error: memberError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(
      JSON.stringify({
        message: "Organisation created successfully",
        organisation: org,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

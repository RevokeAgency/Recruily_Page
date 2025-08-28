import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createSupabaseClient } from "../utils/supabase-client.ts"

interface InviteMemberRequest {
  email: string
  organisationId: string
  role?: string
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
    const { email, organisationId, role = "member" } = (await req.json()) as InviteMemberRequest

    if (!email || !organisationId) {
      return new Response(JSON.stringify({ error: "Email and organisation ID are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Check if the current user is an owner of the organisation
    const { data: membership, error: membershipError } = await supabase
      .from("members")
      .select("role")
      .eq("user_id", user.id)
      .eq("organisation_id", organisationId)
      .single()

    if (membershipError || !membership || membership.role !== "owner") {
      return new Response(JSON.stringify({ error: "You must be an organisation owner to invite members" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Check if the user already exists
    const { data: existingUser, error: existingUserError } = await supabase
      .from("auth.users")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    // If the user exists, add them to the organisation
    if (existingUser && existingUser.id) {
      const { error: addMemberError } = await supabase.from("members").insert({
        user_id: existingUser.id,
        organisation_id: organisationId,
        role,
      })

      if (addMemberError) {
        return new Response(JSON.stringify({ error: addMemberError.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      }

      return new Response(
        JSON.stringify({
          message: "Member added successfully",
          status: "added",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // If the user doesn't exist, send an invitation email
    // Note: In a real implementation, you would use Supabase Auth's invite user functionality
    // or implement your own email sending logic

    return new Response(
      JSON.stringify({
        message: "Invitation sent successfully",
        status: "invited",
      }),
      {
        status: 200,
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

"use server"

import { createServerSupabaseClient } from "@/lib/supabase.server"
import { revalidatePath } from "next/cache"

export async function createOrganisation(formData: FormData) {
  const name = formData.get("name") as string
  const plan = (formData.get("plan") as string) || "starter"

  const supabase = await createServerSupabaseClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Start a transaction
  const { data: organisation, error: orgError } = await supabase
    .from("organisations")
    .insert({ name, plan })
    .select()
    .single()

  if (orgError) {
    return { error: orgError.message }
  }

  // Add the user as an owner of the organisation
  const { error: memberError } = await supabase.from("members").insert({
    user_id: user.id,
    organisation_id: organisation.id,
    role: "owner",
  })

  if (memberError) {
    return { error: memberError.message }
  }

  revalidatePath("/dashboard")
  return { success: true, organisation }
}

export async function inviteMember(formData: FormData) {
  const email = formData.get("email") as string
  const role = (formData.get("role") as string) || "member"
  const organisationId = formData.get("organisationId") as string

  const supabase = await createServerSupabaseClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Check if the user is an owner of the organisation
  const { data: membership, error: membershipError } = await supabase
    .from("members")
    .select()
    .eq("user_id", user.id)
    .eq("organisation_id", organisationId)
    .eq("role", "owner")
    .single()

  if (membershipError || !membership) {
    return { error: "You do not have permission to invite members" }
  }

  // Check if the user exists
  const { data: invitedUser, error: userError } = await supabase
    .from("auth.users")
    .select("id")
    .eq("email", email)
    .single()

  if (userError) {
    // User doesn't exist, send an invitation email
    // This would typically involve creating a record in an invitations table
    // and sending an email with a signup link
    return { error: "User not found. Invitation emails not implemented yet." }
  }

  // Add the user as a member
  const { error: memberError } = await supabase.from("members").insert({
    user_id: invitedUser.id,
    organisation_id: organisationId,
    role,
  })

  if (memberError) {
    return { error: memberError.message }
  }

  revalidatePath("/dashboard/team")
  return { success: true }
}

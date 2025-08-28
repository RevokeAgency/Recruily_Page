import { getSupabaseClient } from "./supabase-client"

export async function invokeEdgeFunction<T = any>(
  functionName: string,
  payload: any,
  options?: { noAuth?: boolean },
): Promise<T> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.functions.invoke(functionName, {
    body: payload,
  })

  if (error) {
    console.error(`Error invoking ${functionName}:`, error)
    throw new Error(error.message || `Failed to invoke ${functionName}`)
  }

  return data as T
}

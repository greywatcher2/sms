import { getServerSession } from "next-auth"
import { supabase } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { SafetyDashboard } from "./safety-dashboard"

export default async function SafetyPage() {
  const session = await getServerSession()
  if (!session?.user) {
    redirect("/login")
  }

  // Verify safety officer role
  const { data: userData } = await supabase.from("users").select("role").eq("email", session.user.email).single()

  if (userData?.role !== "safety_officer") {
    redirect("/dashboard")
  }

  // Get today's access logs
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: accessLogs } = await supabase
    .from("access_logs")
    .select(`
      *,
      rfid_cards (
        type,
        users (
          first_name,
          last_name
        ),
        visitors (
          first_name,
          last_name,
          purpose
        )
      )
    `)
    .gte("timestamp", today.toISOString())
    .order("timestamp", { ascending: false })

  // Get active visitors
  const { data: activeVisitors } = await supabase
    .from("visitors")
    .select(`
      *,
      rfid_cards!inner (
        card_number
      )
    `)
    .eq("status", "active")

  return <SafetyDashboard initialAccessLogs={accessLogs || []} initialVisitors={activeVisitors || []} />
}


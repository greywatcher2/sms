import { getServerSession } from "next-auth"
import { supabase } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { CashierInterface } from "./cashier-interface"

export default async function CashierPage() {
  const session = await getServerSession()
  if (!session?.user) {
    redirect("/login")
  }

  // Verify cashier role
  const { data: userData } = await supabase.from("users").select("role").eq("email", session.user.email).single()

  if (userData?.role !== "cashier") {
    redirect("/dashboard")
  }

  // Get pending queues
  const { data: queues } = await supabase
    .from("queue")
    .select(`
      *,
      users (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq("status", "waiting")
    .order("created_at")

  // Get pending invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      *,
      users (
        id,
        first_name,
        last_name,
        email
      ),
      invoice_items (
        id,
        amount,
        fee_types (
          name,
          category
        )
      )
    `)
    .in("status", ["pending", "partial"])
    .order("created_at")

  return <CashierInterface initialQueues={queues || []} initialInvoices={invoices || []} />
}


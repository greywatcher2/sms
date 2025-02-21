import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { invoiceId, amount, paymentMethod, referenceNumber, notes } = body

    // Get cashier ID
    const { data: cashier } = await supabase.from("users").select("id, role").eq("email", session.user.email).single()

    if (!cashier || cashier.role !== "cashier") {
      return NextResponse.json({ error: "Unauthorized to process payments" }, { status: 403 })
    }

    // Start a transaction
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        invoice_id: invoiceId,
        amount,
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        notes,
        processed_by: cashier.id,
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    // Update invoice balance
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("balance, total_amount")
      .eq("id", invoiceId)
      .single()

    if (invoiceError) throw invoiceError

    const newBalance = invoice.balance - amount
    const newStatus = newBalance <= 0 ? "paid" : "partial"

    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        balance: newBalance,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId)

    if (updateError) throw updateError

    // Notify finance officer
    await supabase.from("notifications").insert({
      user_id: (await supabase.from("users").select("id").eq("role", "finance_officer").single()).data?.id,
      title: "New Payment Processed",
      message: `A payment of ${amount} has been processed for Invoice #${invoiceId}`,
      type: "payment",
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error("Payment processing error:", error)
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
  }
}


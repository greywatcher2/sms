import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { cardNumber, accessPoint, direction } = body

    // Get RFID card details
    const { data: rfidCard } = await supabase
      .from("rfid_cards")
      .select("id, type, status, expires_at")
      .eq("card_number", cardNumber)
      .single()

    if (!rfidCard) {
      return NextResponse.json({ error: "Invalid RFID card" }, { status: 404 })
    }

    // Check if card is active and not expired
    if (rfidCard.status !== "active") {
      return NextResponse.json({ error: "Inactive RFID card" }, { status: 403 })
    }

    if (rfidCard.expires_at && new Date(rfidCard.expires_at) < new Date()) {
      return NextResponse.json({ error: "Expired RFID card" }, { status: 403 })
    }

    // Log access
    const { data: accessLog, error } = await supabase
      .from("access_logs")
      .insert({
        rfid_card_id: rfidCard.id,
        access_point: accessPoint,
        direction,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(accessLog)
  } catch (error) {
    console.error("Access log error:", error)
    return NextResponse.json({ error: "Failed to log access" }, { status: 500 })
  }
}


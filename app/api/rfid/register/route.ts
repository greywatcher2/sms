import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify safety officer role
    const { data: officer } = await supabase.from("users").select("role").eq("email", session.user.email).single()

    if (officer?.role !== "safety_officer") {
      return NextResponse.json({ error: "Unauthorized to register RFID cards" }, { status: 403 })
    }

    const body = await request.json()
    const { cardNumber, userId, type, expiresAt } = body

    // Register RFID card
    const { data: rfidCard, error } = await supabase
      .from("rfid_cards")
      .insert({
        card_number: cardNumber,
        user_id: userId,
        type,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (error) throw error

    // If registering a visitor
    if (type === "visitor") {
      const { firstName, lastName, contactNumber, purpose, visiting, idType, idNumber } = body

      const { error: visitorError } = await supabase.from("visitors").insert({
        first_name: firstName,
        last_name: lastName,
        contact_number: contactNumber,
        purpose,
        visiting,
        id_type: idType,
        id_number: idNumber,
        rfid_card_id: rfidCard.id,
      })

      if (visitorError) throw visitorError
    }

    return NextResponse.json(rfidCard)
  } catch (error) {
    console.error("RFID registration error:", error)
    return NextResponse.json({ error: "Failed to register RFID card" }, { status: 500 })
  }
}


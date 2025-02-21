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
    const { purpose } = body

    // Get student ID
    const { data: student } = await supabase.from("users").select("id").eq("email", session.user.email).single()

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Get latest queue number for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: latestQueue } = await supabase
      .from("queue")
      .select("number")
      .gte("created_at", today.toISOString())
      .order("number", { ascending: false })
      .limit(1)
      .single()

    const nextNumber = (latestQueue?.number || 0) + 1

    // Create queue entry
    const { data: queue, error } = await supabase
      .from("queue")
      .insert({
        number: nextNumber,
        student_id: student.id,
        purpose,
        status: "waiting",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(queue)
  } catch (error) {
    console.error("Queue generation error:", error)
    return NextResponse.json({ error: "Failed to generate queue number" }, { status: 500 })
  }
}


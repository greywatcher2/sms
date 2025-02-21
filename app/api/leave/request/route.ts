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
    const { leaveTypeId, startDate, endDate, reason } = body

    // Get user's manager based on role hierarchy
    const { data: userData } = await supabase.from("users").select("id, role").eq("email", session.user.email).single()

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get appropriate manager based on role
    const { data: managerData } = await supabase
      .from("users")
      .select("id")
      .eq("role", userData.role === "teacher" ? "principal" : "hr_officer")
      .single()

    if (!managerData) {
      return NextResponse.json({ error: "No manager found" }, { status: 404 })
    }

    // Create leave request
    const { data: leaveRequest, error } = await supabase
      .from("leave_requests")
      .insert({
        user_id: userData.id,
        leave_type_id: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        reason,
        manager_id: managerData.id,
      })
      .select()
      .single()

    if (error) throw error

    // Create notification for manager
    await supabase.from("notifications").insert({
      user_id: managerData.id,
      title: "New Leave Request",
      message: `A new leave request requires your approval`,
      type: "leave_request",
    })

    return NextResponse.json(leaveRequest)
  } catch (error) {
    console.error("Leave request error:", error)
    return NextResponse.json({ error: "Failed to submit leave request" }, { status: 500 })
  }
}


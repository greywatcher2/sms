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
    const { leaveRequestId, status, notes, approvalType } = body

    // Get user role
    const { data: userData } = await supabase.from("users").select("role").eq("email", session.user.email).single()

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify user has permission to approve
    if (!["principal", "hr_officer"].includes(userData.role)) {
      return NextResponse.json({ error: "Unauthorized to approve leaves" }, { status: 403 })
    }

    // Update leave request based on approval type
    const updateData =
      approvalType === "manager"
        ? {
            manager_approval_status: status,
            manager_notes: notes,
          }
        : {
            hr_approval_status: status,
            hr_notes: notes,
          }

    const { data: leaveRequest, error } = await supabase
      .from("leave_requests")
      .update(updateData)
      .eq("id", leaveRequestId)
      .select(`
        *,
        users!leave_requests_user_id_fkey (
          email,
          first_name,
          last_name
        )
      `)
      .single()

    if (error) throw error

    // Create notification for employee
    await supabase.from("notifications").insert({
      user_id: leaveRequest.user_id,
      title: "Leave Request Update",
      message: `Your leave request has been ${status} by ${approvalType === "manager" ? "your manager" : "HR"}`,
      type: "leave_status",
    })

    // If manager approved, notify HR
    if (approvalType === "manager" && status === "approved") {
      const { data: hrOfficer } = await supabase.from("users").select("id").eq("role", "hr_officer").single()

      if (hrOfficer) {
        await supabase.from("notifications").insert({
          user_id: hrOfficer.id,
          title: "Leave Request for Review",
          message: `A manager-approved leave request requires your review`,
          type: "leave_request",
        })
      }
    }

    return NextResponse.json(leaveRequest)
  } catch (error) {
    console.error("Leave approval error:", error)
    return NextResponse.json({ error: "Failed to process leave approval" }, { status: 500 })
  }
}


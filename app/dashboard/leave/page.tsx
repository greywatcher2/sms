import { getServerSession } from "next-auth"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { LeaveRequestsTable } from "./leave-requests-table"

export default async function LeaveDashboardPage() {
  const session = await getServerSession()

  if (!session?.user) {
    return null
  }

  // Get user's role and leave requests
  const { data: userData } = await supabase.from("users").select("id, role").eq("email", session.user.email).single()

  const isManager = ["principal", "hr_officer"].includes(userData?.role || "")

  // Get leave requests based on role
  let query = supabase.from("leave_requests").select(`
      *,
      users!leave_requests_user_id_fkey (
        email,
        first_name,
        last_name
      ),
      leave_types (
        name
      )
    `)

  if (!isManager) {
    // Regular employees see only their requests
    query = query.eq("user_id", userData?.id)
  } else if (userData?.role === "principal") {
    // Principals see requests they need to approve
    query = query.eq("manager_id", userData.id)
  }

  const { data: leaveRequests } = await query.order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leave Management</h1>
        {!isManager && (
          <Button asChild>
            <Link href="/dashboard/leave/request">New Leave Request</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{leaveRequests?.filter((r) => r.status === "pending").length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approved Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{leaveRequests?.filter((r) => r.status === "approved").length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rejected Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{leaveRequests?.filter((r) => r.status === "rejected").length || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <LeaveRequestsTable requests={leaveRequests || []} isManager={isManager} userRole={userData?.role} />
        </CardContent>
      </Card>
    </div>
  )
}


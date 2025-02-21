import { getServerSession } from "next-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const session = await getServerSession()
  const userRole = session?.user?.role || "student"

  const roleGreetings = {
    superadmin: "Welcome, System Administrator",
    academic_director: "Welcome, Academic Director",
    principal: "Welcome, Principal",
    teacher: "Welcome, Teacher",
    student: "Welcome, Student",
    // Add more role-specific greetings
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{roleGreetings[userRole as keyof typeof roleGreetings] || "Welcome"}</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Role-specific actions will appear here</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Your recent activities will appear here</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Important notifications will appear here</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


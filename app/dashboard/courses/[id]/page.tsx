import { getServerSession } from "next-auth"
import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CourseOverview } from "./course-overview"
import { CourseGrades } from "./course-grades"
import { CourseAttendance } from "./course-attendance"

export default async function CoursePage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession()
  if (!session?.user) return null

  const { data: course } = await supabase
    .from("courses")
    .select(`
      *,
      users!courses_teacher_id_fkey (
        id,
        email,
        first_name,
        last_name
      )
    `)
    .eq("id", params.id)
    .single()

  if (!course) {
    notFound()
  }

  // Get user's role
  const { data: userData } = await supabase.from("users").select("role").eq("email", session.user.email).single()

  const isTeacher = course.teacher_id === userData?.id
  const isAdmin = ["principal", "academic_director"].includes(userData?.role || "")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{course.name}</h1>
        <p className="text-muted-foreground">{course.code}</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CourseOverview course={course} isTeacher={isTeacher} isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="grades">
          <CourseGrades course={course} isTeacher={isTeacher} isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="attendance">
          <CourseAttendance course={course} isTeacher={isTeacher} />
        </TabsContent>
      </Tabs>
    </div>
  )
}


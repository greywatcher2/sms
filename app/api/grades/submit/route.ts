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
    const { courseId, studentId, assignmentId, score, feedback } = body

    // Verify teacher's permission
    const { data: course } = await supabase.from("courses").select("teacher_id").eq("id", courseId).single()

    const { data: teacher } = await supabase.from("users").select("id").eq("email", session.user.email).single()

    if (course?.teacher_id !== teacher?.id) {
      return NextResponse.json({ error: "Unauthorized to submit grades for this course" }, { status: 403 })
    }

    // Submit grade
    const { data: grade, error } = await supabase
      .from("grades")
      .insert({
        course_id: courseId,
        student_id: studentId,
        assignment_id: assignmentId,
        score,
        feedback,
        status: "submitted",
      })
      .select()
      .single()

    if (error) throw error

    // Notify academic director and principal
    const { data: admins } = await supabase.from("users").select("id").in("role", ["academic_director", "principal"])

    if (admins) {
      await supabase.from("notifications").insert(
        admins.map((admin) => ({
          user_id: admin.id,
          title: "New Grade Submission",
          message: `A new grade has been submitted for review in ${courseId}`,
          type: "grade_submission",
        })),
      )
    }

    return NextResponse.json(grade)
  } catch (error) {
    console.error("Grade submission error:", error)
    return NextResponse.json({ error: "Failed to submit grade" }, { status: 500 })
  }
}


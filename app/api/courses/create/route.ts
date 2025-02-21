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
    const { code, name, description, academicYear, semester, level, teacherId } = body

    // Create course
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert({
        code,
        name,
        description,
        academic_year: academicYear,
        semester,
        level,
        teacher_id: teacherId,
      })
      .select()
      .single()

    if (courseError) throw courseError

    // Create grade periods based on level
    const gradePeriods =
      level === "college"
        ? [
            { name: "Prelim", weight: 0.2 },
            { name: "Midterm", weight: 0.2 },
            { name: "Semifinal", weight: 0.2 },
            { name: "Final", weight: 0.4 },
          ]
        : [
            { name: "Q1", weight: 0.25 },
            { name: "Q2", weight: 0.25 },
            { name: "Q3", weight: 0.25 },
            { name: "Q4", weight: 0.25 },
          ]

    for (const period of gradePeriods) {
      await supabase.from("grade_periods").insert({
        course_id: course.id,
        name: period.name,
        status: "upcoming",
      })
    }

    // Notify teacher
    await supabase.from("notifications").insert({
      user_id: teacherId,
      title: "New Course Assignment",
      message: `You have been assigned as the teacher for ${name} (${code})`,
      type: "course_assignment",
    })

    return NextResponse.json(course)
  } catch (error) {
    console.error("Course creation error:", error)
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 })
  }
}


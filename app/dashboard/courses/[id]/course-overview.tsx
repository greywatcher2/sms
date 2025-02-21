"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  course: any
  isTeacher: boolean
  isAdmin: boolean
}

export function CourseOverview({ course, isTeacher, isAdmin }: Props) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <strong>Code:</strong> {course.code}
            </p>
            <p>
              <strong>Name:</strong> {course.name}
            </p>
            <p>
              <strong>Description:</strong> {course.description}
            </p>
            <p>
              <strong>Academic Year:</strong> {course.academic_year}
            </p>
            <p>
              <strong>Semester:</strong> {course.semester}
            </p>
            <p>
              <strong>Level:</strong> {course.level}
            </p>
            <p>
              <strong>Teacher:</strong> {course.users?.first_name} {course.users?.last_name} ({course.users?.email})
            </p>
          </div>
        </CardContent>
      </Card>

      {isTeacher && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button>Edit Course</Button>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button>Manage Course</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


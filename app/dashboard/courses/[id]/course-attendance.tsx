"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Props {
  course: any
  isTeacher: boolean
}

export function CourseAttendance({ course, isTeacher }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [loading, setLoading] = useState(false)

  async function handleAttendanceSubmission(studentId: string, status: string) {
    if (!selectedDate) return

    setLoading(true)
    try {
      const response = await fetch("/api/attendance/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: course.id,
          studentId,
          date: selectedDate.toISOString(),
          status,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit attendance")
      }

      // Refresh the page to show updated attendance
      window.location.reload()
    } catch (error) {
      console.error("Attendance submission error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-md border" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Classes:</span>
                <span className="font-bold">15</span>
              </div>
              <div className="flex justify-between">
                <span>Present:</span>
                <span className="font-bold text-green-600">13</span>
              </div>
              <div className="flex justify-between">
                <span>Absent:</span>
                <span className="font-bold text-red-600">1</span>
              </div>
              <div className="flex justify-between">
                <span>Late:</span>
                <span className="font-bold text-yellow-600">1</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                {isTeacher && <TableHead>Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Add student attendance rows here */}
              <TableRow>
                <TableCell>John Doe</TableCell>
                <TableCell>Present</TableCell>
                {isTeacher && (
                  <TableCell>
                    <Select
                      onValueChange={(value) => handleAttendanceSubmission("student-id", value)}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                )}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}


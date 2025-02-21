"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Props {
  course: any
  isTeacher: boolean
  isAdmin: boolean
}

export function CourseGrades({ course, isTeacher, isAdmin }: Props) {
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const isBasicEd = ["elementary", "junior_high", "senior_high"].includes(course.level)

  async function handleGradeSubmission(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch("/api/grades/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: course.id,
          studentId: selectedStudent.id,
          score: formData.get("score"),
          feedback: formData.get("feedback"),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit grade")
      }

      // Refresh the page to show updated grades
      window.location.reload()
    } catch (error) {
      console.error("Grade submission error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isBasicEd ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Written Works</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">30%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Performance Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">50%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Quarterly Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">20%</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Prelim</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">20%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Midterm</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">20%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Semifinal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">20%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Final</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">40%</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Grades</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                {isBasicEd ? (
                  <>
                    <TableHead>Written Works</TableHead>
                    <TableHead>Performance Tasks</TableHead>
                    <TableHead>Quarterly Assessment</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Prelim</TableHead>
                    <TableHead>Midterm</TableHead>
                    <TableHead>Semifinal</TableHead>
                    <TableHead>Final</TableHead>
                  </>
                )}
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Add student grade rows here */}
              <TableRow>
                <TableCell>John Doe</TableCell>
                {isBasicEd ? (
                  <>
                    <TableCell>85</TableCell>
                    <TableCell>90</TableCell>
                    <TableCell>88</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>88</TableCell>
                    <TableCell>85</TableCell>
                    <TableCell>90</TableCell>
                    <TableCell>92</TableCell>
                  </>
                )}
                <TableCell>
                  <Badge>Pending</Badge>
                </TableCell>
                <TableCell>
                  {isTeacher && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">Enter Grade</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Enter Grade</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleGradeSubmission} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="score">Score</Label>
                            <Input id="score" name="score" type="number" min="0" max="100" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="feedback">Feedback</Label>
                            <Textarea id="feedback" name="feedback" placeholder="Add feedback for the student" />
                          </div>
                          <Button type="submit" disabled={loading}>
                            {loading ? "Submitting..." : "Submit Grade"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                  {isAdmin && <Button variant="outline">Review</Button>}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}


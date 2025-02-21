"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface LeaveRequest {
  id: string
  start_date: string
  end_date: string
  reason: string
  status: string
  manager_approval_status: string
  hr_approval_status: string
  users: {
    email: string
    first_name: string
    last_name: string
  }
  leave_types: {
    name: string
  }
}

interface Props {
  requests: LeaveRequest[]
  isManager: boolean
  userRole?: string
}

export function LeaveRequestsTable({ requests, isManager, userRole }: Props) {
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [approvalNotes, setApprovalNotes] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleApproval(status: "approved" | "rejected") {
    if (!selectedRequest) return

    setLoading(true)
    try {
      const response = await fetch("/api/leave/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leaveRequestId: selectedRequest.id,
          status,
          notes: approvalNotes,
          approvalType: userRole === "principal" ? "manager" : "hr",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to process approval")
      }

      // Refresh the page to show updated status
      window.location.reload()
    } catch (error) {
      console.error("Approval error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Leave Type</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                {request.users.first_name} {request.users.last_name}
              </TableCell>
              <TableCell>{request.leave_types.name}</TableCell>
              <TableCell>{format(new Date(request.start_date), "PP")}</TableCell>
              <TableCell>{format(new Date(request.end_date), "PP")}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    request.status === "approved"
                      ? "success"
                      : request.status === "rejected"
                        ? "destructive"
                        : "default"
                  }
                >
                  {request.status}
                </Badge>
              </TableCell>
              <TableCell>
                {isManager && request.status === "pending" && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => setSelectedRequest(request)}>
                        Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Review Leave Request</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium">Reason for Leave</h4>
                          <p className="mt-1 text-sm">{request.reason}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Notes</label>
                          <Textarea
                            value={approvalNotes}
                            onChange={(e) => setApprovalNotes(e.target.value)}
                            placeholder="Add any notes about your decision"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="destructive" disabled={loading} onClick={() => handleApproval("rejected")}>
                            Reject
                          </Button>
                          <Button disabled={loading} onClick={() => handleApproval("approved")}>
                            Approve
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}


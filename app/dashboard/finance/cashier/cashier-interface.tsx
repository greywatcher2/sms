"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Props {
  initialQueues: any[]
  initialInvoices: any[]
}

export function CashierInterface({ initialQueues, initialInvoices }: Props) {
  const [queues, setQueues] = useState(initialQueues)
  const [invoices, setInvoices] = useState(initialInvoices)
  const [currentQueue, setCurrentQueue] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function callNextQueue() {
    if (queues.length === 0) return

    const nextQueue = queues[0]
    setLoading(true)

    try {
      const response = await fetch("/api/queue/next", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          queueId: nextQueue.id,
          windowNumber: 1, // Hardcoded for simplicity
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to process queue")
      }

      setCurrentQueue(nextQueue)
      setQueues(queues.slice(1))
    } catch (error) {
      console.error("Queue processing error:", error)
    } finally {
      setLoading(false)
    }
  }

  async function processPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch("/api/payments/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId: formData.get("invoiceId"),
          amount: formData.get("amount"),
          paymentMethod: formData.get("paymentMethod"),
          referenceNumber: formData.get("referenceNumber"),
          notes: formData.get("notes"),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to process payment")
      }

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error("Payment processing error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Queue</CardTitle>
          </CardHeader>
          <CardContent>
            {currentQueue ? (
              <div className="space-y-4">
                <div className="text-4xl font-bold text-center">{currentQueue.number}</div>
                <div className="text-center">
                  {currentQueue.users.first_name} {currentQueue.users.last_name}
                </div>
                <div className="text-center text-muted-foreground">{currentQueue.purpose}</div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">No active queue</div>
            )}
            <div className="mt-4">
              <Button className="w-full" onClick={callNextQueue} disabled={loading || queues.length === 0}>
                {loading ? "Processing..." : "Call Next"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Waiting Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {queues.map((queue) => (
                <div key={queue.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div className="font-bold">{queue.number}</div>
                  <div className="text-sm text-muted-foreground">{queue.purpose}</div>
                </div>
              ))}
              {queues.length === 0 && <div className="text-center text-muted-foreground">No waiting queues</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    {invoice.users.first_name} {invoice.users.last_name}
                  </TableCell>
                  <TableCell>₱{invoice.total_amount.toFixed(2)}</TableCell>
                  <TableCell>₱{invoice.balance.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        invoice.status === "paid" ? "success" : invoice.status === "partial" ? "warning" : "default"
                      }
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">Process Payment</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Process Payment</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={processPayment} className="space-y-4">
                          <input type="hidden" name="invoiceId" value={invoice.id} />
                          <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input id="amount" name="amount" type="number" step="0.01" max={invoice.balance} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="paymentMethod">Payment Method</Label>
                            <Select name="paymentMethod" required>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment method" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="check">Check</SelectItem>
                                <SelectItem value="online">Online</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="referenceNumber">Reference Number</Label>
                            <Input id="referenceNumber" name="referenceNumber" placeholder="Optional" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Input id="notes" name="notes" placeholder="Optional" />
                          </div>
                          <Button type="submit" disabled={loading}>
                            {loading ? "Processing..." : "Submit Payment"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}


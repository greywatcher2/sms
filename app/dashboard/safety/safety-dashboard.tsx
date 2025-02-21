"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

interface Props {
  initialAccessLogs: any[]
  initialVisitors: any[]
}

export function SafetyDashboard({ initialAccessLogs, initialVisitors }: Props) {
  const [accessLogs, setAccessLogs] = useState(initialAccessLogs)
  const [visitors, setVisitors] = useState(initialVisitors)
  const [loading, setLoading] = useState(false)

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel("safety_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "access_logs",
        },
        (payload) => {
          // Fetch updated access logs
          fetchAccessLogs()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "visitors",
        },
        (payload) => {
          // Fetch updated visitors
          fetchVisitors()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchAccessLogs() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from("access_logs")
      .select(`
        *,
        rfid_cards (
          type,
          users (
            first_name,
            last_name
          ),
          visitors (
            first_name,
            last_name,
            purpose
          )
        )
      `)
      .gte("timestamp", today.toISOString())
      .order("timestamp", { ascending: false })

    setAccessLogs(data || [])
  }

  async function fetchVisitors() {
    const { data } = await supabase
      .from("visitors")
      .select(`
        *,
        rfid_cards!inner (
          card_number
        )
      `)
      .eq("status", "active")

    setVisitors(data || [])
  }

  async function registerVisitor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch("/api/rfid/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardNumber: formData.get("cardNumber"),
          type: "visitor",
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          contactNumber: formData.get("contactNumber"),
          purpose: formData.get("purpose"),
          visiting: formData.get("visiting"),
          idType: formData.get("idType"),
          idNumber: formData.get("idNumber"),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to register visitor")
      }

      // Refresh the visitors list
      fetchVisitors()
    } catch (error) {
      console.error("Visitor registration error:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const currentCounts = {
    students: accessLogs.filter(
      (log) =>
        log.rfid_cards.type === "student" &&
        log.direction === "in" &&
        !accessLogs.find(
          (l) =>
            l.rfid_cards.id === log.rfid_cards.id &&
            l.direction === "out" &&
            new Date(l.timestamp) > new Date(log.timestamp),
        ),
    ).length,
    personnel: accessLogs.filter(
      (log) =>
        log.rfid_cards.type === "personnel" &&
        log.direction === "in" &&
        !accessLogs.find(
          (l) =>
            l.rfid_cards.id === log.rfid_cards.id &&
            l.direction === "out" &&
            new Date(l.timestamp) > new Date(log.timestamp),
        ),
    ).length,
    visitors: visitors.length,
    parents: accessLogs.filter(
      (log) =>
        log.rfid_cards.type === "parent" &&
        log.direction === "in" &&
        !accessLogs.find(
          (l) =>
            l.rfid_cards.id === log.rfid_cards.id &&
            l.direction === "out" &&
            new Date(l.timestamp) > new Date(log.timestamp),
        ),
    ).length,
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Students Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentCounts.students}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personnel Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentCounts.personnel}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Visitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentCounts.visitors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parents Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentCounts.parents}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recent Access Logs</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Register Visitor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Visitor</DialogTitle>
            </DialogHeader>
            <form onSubmit={registerVisitor} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" name="firstName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input id="contactNumber" name="contactNumber" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of Visit</Label>
                <Input id="purpose" name="purpose" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visiting">Person/Department to Visit</Label>
                <Input id="visiting" name="visiting" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="idType">ID Type</Label>
                  <Select name="idType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="government">Government ID</SelectItem>
                      <SelectItem value="company">Company ID</SelectItem>
                      <SelectItem value="school">School ID</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idNumber">ID Number</Label>
                  <Input id="idNumber" name="idNumber" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardNumber">RFID Card Number</Label>
                <Input id="cardNumber" name="cardNumber" required />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Registering..." : "Register Visitor"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Access Point</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accessLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.timestamp).toLocaleTimeString()}</TableCell>
                  <TableCell>
                    {log.rfid_cards.type === "visitor"
                      ? `${log.rfid_cards.visitors.first_name} ${log.rfid_cards.visitors.last_name}`
                      : `${log.rfid_cards.users.first_name} ${log.rfid_cards.users.last_name}`}
                  </TableCell>
                  <TableCell>
                    <Badge>{log.rfid_cards.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.direction === "in" ? "success" : "destructive"}>{log.direction}</Badge>
                  </TableCell>
                  <TableCell>{log.access_point}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Visitors</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Visiting</TableHead>
                <TableHead>Entry Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visitors.map((visitor) => (
                <TableRow key={visitor.id}>
                  <TableCell>
                    {visitor.first_name} {visitor.last_name}
                  </TableCell>
                  <TableCell>{visitor.purpose}</TableCell>
                  <TableCell>{visitor.visiting}</TableCell>
                  <TableCell>{new Date(visitor.created_at).toLocaleTimeString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}


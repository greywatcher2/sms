"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

export default function QueueDisplayPage() {
  const [currentQueue, setCurrentQueue] = useState<any>(null)
  const [nextQueues, setNextQueues] = useState<any[]>([])

  useEffect(() => {
    // Subscribe to queue changes
    const channel = supabase
      .channel("queue_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue",
        },
        (payload) => {
          fetchQueueData()
        },
      )
      .subscribe()

    fetchQueueData()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchQueueData() {
    // Get current serving queue
    const { data: current } = await supabase
      .from("queue")
      .select(`
        *,
        users (
          first_name,
          last_name
        )
      `)
      .eq("status", "serving")
      .order("created_at")
      .limit(1)
      .single()

    setCurrentQueue(current)

    // Get next 5 waiting queues
    const { data: waiting } = await supabase
      .from("queue")
      .select(`
        *,
        users (
          first_name,
          last_name
        )
      `)
      .eq("status", "waiting")
      .order("created_at")
      .limit(5)

    setNextQueues(waiting || [])
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Queue Display</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Now Serving</CardTitle>
          </CardHeader>
          <CardContent>
            {currentQueue ? (
              <div className="text-center">
                <div className="text-7xl font-bold mb-4">{currentQueue.number}</div>
                <div className="text-2xl text-muted-foreground">Window {currentQueue.window_number}</div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">No active queue</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next in Line</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nextQueues.map((queue) => (
                <div key={queue.id} className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{queue.number}</div>
                  <div className="text-muted-foreground">{queue.purpose}</div>
                </div>
              ))}
              {nextQueues.length === 0 && <div className="text-center text-muted-foreground">No waiting queues</div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Served:</span>
                <span className="font-bold">25</span>
              </div>
              <div className="flex justify-between">
                <span>Currently Waiting:</span>
                <span className="font-bold">{nextQueues.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Wait Time:</span>
                <span className="font-bold">15 mins</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


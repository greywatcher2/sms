import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { DashboardNav } from "./nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}


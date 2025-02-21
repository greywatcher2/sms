"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { BookOpen, Building2, GraduationCap, Users, Wallet, Settings } from "lucide-react"

const roleNavItems = {
  superadmin: [
    {
      title: "Overview",
      href: "/dashboard",
      icon: Building2,
    },
    {
      title: "Academic",
      href: "/dashboard/academic",
      icon: BookOpen,
    },
    {
      title: "HR Management",
      href: "/dashboard/hr",
      icon: Users,
    },
    {
      title: "Finance",
      href: "/dashboard/finance",
      icon: Wallet,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ],
  academic_director: [
    {
      title: "Overview",
      href: "/dashboard",
      icon: Building2,
    },
    {
      title: "Academic",
      href: "/dashboard/academic",
      icon: BookOpen,
    },
  ],
  teacher: [
    {
      title: "Overview",
      href: "/dashboard",
      icon: Building2,
    },
    {
      title: "Classes",
      href: "/dashboard/classes",
      icon: GraduationCap,
    },
  ],
  // Add more role-specific navigation items here
}

export function DashboardNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user?.role || "student"
  const navItems = roleNavItems[userRole as keyof typeof roleNavItems] || []

  return (
    <nav className="w-64 min-h-screen bg-gray-900 text-white p-4">
      <div className="space-y-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
              pathname === item.href ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800",
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}


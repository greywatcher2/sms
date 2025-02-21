import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Role hierarchy and permissions
const roleHierarchy = {
  superadmin: ["*"],
  academic_director: ["principal", "teacher", "student"],
  principal: ["teacher", "student"],
  teacher: ["student"],
  hr_officer: ["teacher", "finance_officer"],
  finance_officer: ["cashier"],
  cashier: [],
  osas_coordinator: [],
  guidance_advocate: [],
  school_president: [],
  research_officer: [],
  librarian: [],
  it_personnel: [],
  safety_officer: ["parent_visitor"],
  student: [],
  parent_visitor: [],
}

// Protected routes and their required roles
const protectedRoutes = {
  "/dashboard/admin": ["superadmin"],
  "/dashboard/academic": ["academic_director", "principal"],
  "/dashboard/hr": ["hr_officer"],
  "/dashboard/finance": ["finance_officer", "cashier"],
  "/dashboard/teacher": ["teacher"],
  "/dashboard/student": ["student"],
}

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })

  // If user is not logged in, redirect to login page
  if (!token) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  const userRole = token.role as string
  const path = request.nextUrl.pathname

  // Check if the path is protected
  for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
    if (path.startsWith(route)) {
      const hasAccess = allowedRoles.some(
        (role) =>
          userRole === role || roleHierarchy[userRole]?.includes(role) || roleHierarchy[userRole]?.includes("*"),
      )

      if (!hasAccess) {
        const dashboardUrl = new URL("/dashboard", request.url)
        return NextResponse.redirect(dashboardUrl)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/dashboard/:path*",
}


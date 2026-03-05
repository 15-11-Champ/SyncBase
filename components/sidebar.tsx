'use client'

import Link from 'next/link'
import {
  Calendar,
  Users,
  Settings,
  BarChart3,
  LogOut,
  Users2,
  Scissors,
  FileText,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import TenantSwitcher from '@/components/tenant-switcher'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const role = user?.role
  const router = useRouter()

  const [staffOpen, setStaffOpen] = useState(true)
  const [dashboardOpen, setDashboardOpen] = useState(true)
  const [appointmentsOpen, setAppointmentsOpen] = useState(true)

  // For development: allow access to all tabs
  const isAdmin = true

  // ⬇️ Key function for inline Staff Performance
  const openStaffPerformanceInPage = () => {
    try {
      localStorage.setItem('openStaffPerformance', 'true')
    } catch { }

    router.push('/staff') // not a new page, same route but triggers section
  }

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">

      {/* Header */}
      <div className="p-6 border-b border-sidebar-border space-y-3">
        <h1 className="text-2xl font-bold text-sidebar-primary">Syncbase</h1>
        <TenantSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">

        {/* Appointments */}
        <div className="space-y-1">
          <Button
            variant="ghost"
            onClick={() => setAppointmentsOpen(!appointmentsOpen)}
            className="w-full justify-between gap-3"
          >
            <span className="flex items-center gap-3">
              <Calendar className="w-4 h-4" />
              Appointments
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${appointmentsOpen ? 'rotate-180' : ''}`} />
          </Button>

          {appointmentsOpen && (
            <div className="ml-4 space-y-1 border-l">
              <Link href="/appointments/book">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm pl-4"
                >
                  <Calendar className="w-3 h-3" />
                  Book Appointments
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Clients */}
        <Link href="/clients">
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Users className="w-4 h-4" />
            Clients
          </Button>
        </Link>

        {/* Dashboard */}
        {isAdmin && (
          <div className="space-y-1">
            <Button
              variant="ghost"
              onClick={() => setDashboardOpen(!dashboardOpen)}
              className="w-full justify-between gap-3"
            >
              <span className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${dashboardOpen ? 'rotate-180' : ''}`} />
            </Button>

            {dashboardOpen && (
              <div className="ml-4 space-y-1 border-l">

                <Link href="/analytics">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm pl-4"
                  >
                    Analytics
                  </Button>
                </Link>

                <Link href="/finance">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm pl-4"
                  >
                    Finance
                  </Button>
                </Link>

              </div>
            )}
          </div>
        )}

        {/* Staff */}
        <div className="space-y-1">

          <Button
            variant="ghost"
            onClick={() => setStaffOpen(!staffOpen)}
            className="w-full justify-between gap-3"
          >
            <span className="flex items-center gap-3">
              <Users2 className="w-4 h-4" />
              Staff
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${staffOpen ? 'rotate-180' : ''}`} />
          </Button>

          {staffOpen && (
            <div className="ml-4 space-y-1 border-l">

              {isAdmin && (
                <Link href="/staff">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm pl-4"
                  >
                    Staff Management
                  </Button>
                </Link>
              )}

              {/* Inline staff performance */}
              {isAdmin && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm pl-4"
                  onClick={openStaffPerformanceInPage}
                >
                  <BarChart3 className="w-3 h-3" />
                  Staff Performance
                </Button>
              )}

              {/* Attendance */}
              <Link href="/attendance">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm pl-4"
                >
                  <Calendar className="w-3 h-3" />
                  Attendance
                </Button>
              </Link>

              {/* History */}
              <Link href="/history">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm pl-4"
                >
                  <BarChart3 className="w-3 h-3" />
                  History
                </Button>
              </Link>

              {/* Payroll */}
              {isAdmin && (
                <Link href="/payroll">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm pl-4"
                  >
                    Payroll Management
                  </Button>
                </Link>
              )}

            </div>
          )}

        </div>

        {/* Services */}
        {isAdmin && (
          <Link href="/services">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Scissors className="w-4 h-4" />
              Services
            </Button>
          </Link>
        )}

        {/* Invoices */}
        <Link href="/invoices">
          <Button variant="ghost" className="w-full justify-start gap-3">
            <FileText className="w-4 h-4" />
            Invoices
          </Button>
        </Link>

        {/* Settings */}


      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start gap-3"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>

    </aside>
  )
}

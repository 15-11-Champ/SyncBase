'use client'

import { Bell, Clock, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function DashboardHeader() {
  return (
    <header className="border-b border-border bg-card px-8 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Appointments</h2>
        <p className="text-sm text-muted-foreground mt-1">Today's Schedule</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search appointments..."
            className="pl-10 bg-input border-border"
          />
        </div>

        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
        </Button>

        <Button variant="outline" className="gap-2 text-foreground border-border hover:bg-primary hover:text-primary-foreground">
          <Clock className="w-4 h-4" />
          Book Appointment
        </Button>
      </div>
    </header>
  )
}

export default DashboardHeader
export { DashboardHeader }

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useTenant } from '@/lib/tenant-context'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'

interface Staff {
  id: string
  name: string
  role: string
}

interface Performance {
  today: number
  week: number
  month: number
  total: number
}

function sumForStaff(
  invoices: any[],
  staffId: string,
  dateFilter?: (date: string) => boolean
) {
  let total = 0

  invoices.forEach(inv => {
    if (dateFilter && !dateFilter(inv.invoice_date)) return

    inv.items?.forEach((item: any) => {
      if (item.staff_id === staffId) {
        total += Number(item.amount)
      }
    })
  })

  return total
}

export default function StaffPerformance() {
  const { currentTenant, isLoading: isTenantLoading } = useTenant()
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [performance, setPerformance] = useState<Performance | null>(null)
  const [open, setOpen] = useState(false)

  // ⭐ NEW STATES FOR DATE RANGE
  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")
  const [filteredTotal, setFilteredTotal] = useState<number | null>(null)

  // Load staff
  useEffect(() => {
    if (!isTenantLoading) {
      loadStaff()
    }
  }, [currentTenant, isTenantLoading])

  const loadStaff = async () => {
    if (!currentTenant) return
    const { data, error } = await supabase
      .from('staff')
      .select('id, name, role')
      .eq('tenant_id', currentTenant.id)

    if (!error && data) setStaffList(data)
  }

  // Fetch default performance (today, week, month, total)
  const loadPerformance = async (staffId: string) => {
    if (!currentTenant) return

    // 1️⃣ Get TODAY from DB, not JS
    const { data: todayData, error: todayError } = await supabase
      .from('invoices')
      .select('invoice_date, items')
      .eq('tenant_id', currentTenant.id)
      .eq('invoice_date', new Date().toLocaleDateString('en-CA'))

    if (todayError) return

    // 2️⃣ Get ALL invoices (for week/month/total)
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_date, items')
      .eq('tenant_id', currentTenant.id)

    if (error || !data) return

    const today = sumForStaff(todayData || [], staffId)

    const todayDate = new Date()
    const startOfWeek = new Date(todayDate)
    startOfWeek.setDate(todayDate.getDate() - todayDate.getDay())
    const weekStr = startOfWeek.toLocaleDateString('en-CA')

    const startOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)
    const monthStr = startOfMonth.toLocaleDateString('en-CA')

    const normalize = (d: string) => d.split('T')[0]

    const perf = {
      today,
      week: sumForStaff(data, staffId, d => normalize(d) >= weekStr),
      month: sumForStaff(data, staffId, d => normalize(d) >= monthStr),
      total: sumForStaff(data, staffId),
    }

    setPerformance(perf)
    setFilteredTotal(null)
  }




  // ⭐ NEW: Filter invoices by date range (ONLY updates Total Sale)
  const loadPerformanceByRange = async () => {
    if (!selectedStaff || !fromDate || !toDate || !currentTenant) return

    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_date, items')
      .eq('tenant_id', currentTenant.id)
      .gte('invoice_date', fromDate)
      .lte('invoice_date', toDate)

    if (error || !data) return

    const total = sumForStaff(data, selectedStaff.id)
    setFilteredTotal(total)
  }


  // Open modal
  const openDialog = async (staff: Staff) => {
    setSelectedStaff(staff)
    await loadPerformance(staff.id)
    setOpen(true)
  }

  // ⭐ Reset filter when modal closes
  const handleClose = (state: boolean) => {
    if (!state) {
      setFromDate("")
      setToDate("")
      setFilteredTotal(null)
    }
    setOpen(state)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Staff Performance</h1>
      <p className="text-muted-foreground">View performance metrics for each staff member.</p>

      {/* Staff Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffList.map((staff) => (
          <Card
            key={staff.id}
            className="cursor-pointer hover:shadow-md transition"
            onClick={() => openDialog(staff)}
          >
            <CardHeader>
              <CardTitle>{staff.name}</CardTitle>
              <Badge>{staff.role}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Click to view performance</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Popup */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Performance Details</DialogTitle>
            <DialogDescription>
              Staff performance metrics calculated from invoices.
            </DialogDescription>
          </DialogHeader>

          {selectedStaff && performance && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">{selectedStaff.name}</h2>
              <p className="text-muted-foreground">{selectedStaff.role}</p>

              {/* ⭐ DATE FILTER */}
              <div className="border p-4 rounded-lg space-y-3">
                <h3 className="font-semibold">Filter by Date Range</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> From
                    </label>
                    <input
                      type="date"
                      className="border rounded px-3 py-2 w-full"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> To
                    </label>
                    <input
                      type="date"
                      className="border rounded px-3 py-2 w-full"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button className="w-half" onClick={loadPerformanceByRange}>
                    Generate
                  </Button>
                  <Button
                    variant="outline"
                    className="w-half"
                    onClick={() => {
                      setFromDate("")
                      setToDate("")
                      setFilteredTotal(null)
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {/* Performance Cards */}
              <div className="grid grid-cols-2 gap-4 pt-2">

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Today's Sale</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xl font-bold">
                    ₹{performance.today}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Weekly Sale</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xl font-bold">
                    ₹{performance.week}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Monthly Sale</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xl font-bold">
                    ₹{performance.month}
                  </CardContent>
                </Card>

                {/* ⭐ TOTAL SALE — updated when filter is applied */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {filteredTotal === null ? "Total Sale" : "Filtered Total Sale"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xl font-bold">
                    ₹{filteredTotal === null ? performance.total : filteredTotal}
                  </CardContent>
                </Card>

              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useTenant } from '@/lib/tenant-context'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'

interface AttendanceEntry {
  id: string
  staff_id: string
  date: string
  status: 'present' | 'absent' | 'leave'
}

interface StaffMember {
  id: string
  name: string
  role: string
}

export default function StaffHistory() {
  const { currentTenant, isLoading: isTenantLoading } = useTenant()
  const [selectedMonth, setSelectedMonth] = useState('11')
  const [selectedYear, setSelectedYear] = useState('2025')

  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([])

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ]

  // ✅ Load staff
  const loadStaff = async () => {
    if (!currentTenant) return
    const { data } = await supabase
      .from('staff')
      .select('id, name, role')
      .eq('tenant_id', currentTenant.id)

    if (data) setStaffList(data)
  }

  // ✅ Correct end-of-month logic
  const getEndOfMonth = (year: number, month: number) => {
    return new Date(year, month, 0).toISOString().split('T')[0]
  }

  // ✅ Load attendance
  const loadAttendance = async () => {
    if (!currentTenant) return
    const year = parseInt(selectedYear)
    const month = parseInt(selectedMonth)

    const startDate = `${selectedYear}-${selectedMonth}-01`
    const endDate = getEndOfMonth(year, month)

    const { data } = await supabase
      .from('staff_attendance')
      .select('*')
      .eq('tenant_id', currentTenant.id)
      .gte('date', startDate)
      .lte('date', endDate)

    if (data) setAttendance(data)
  }

  useEffect(() => {
    if (!isTenantLoading) {
      loadStaff()
    }
  }, [currentTenant, isTenantLoading])

  useEffect(() => {
    loadAttendance()
  }, [selectedMonth, selectedYear])

  const getStaffStats = (staffId: string) => {
    const records = attendance.filter(a => a.staff_id === staffId)

    const present = records.filter(a => a.status === 'present').length
    const absent = records.filter(a => a.status === 'absent').length
    const leave = records.filter(a => a.status === 'leave').length
    const total = records.length

    return { present, absent, leave, total }
  }

  if (isTenantLoading) {
    return <div className="space-y-6 flex items-center justify-center h-64">Loading...</div>
  }

  if (!currentTenant) {
    return <div className="space-y-6 flex items-center justify-center h-64">No tenant selected</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Staff History</h1>
        <p className="text-muted-foreground mt-2">
          View attendance statistics for a specific month and year
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-xs">
          <label className="text-sm font-medium mb-2 block">Month</label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 max-w-xs">
          <label className="text-sm font-medium mb-2 block">Year</label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Staff Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffList.map(staff => {
          const stats = getStaffStats(staff.id)

          return (
            <Card key={staff.id}>
              <CardHeader>
                <CardTitle>{staff.name}</CardTitle>
                <CardDescription>{staff.role}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex justify-between p-3 bg-green-500/10 rounded">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Present
                  </span>
                  <span className="font-bold text-green-400">{stats.present}</span>
                </div>

                <div className="flex justify-between p-3 bg-red-500/10 rounded">
                  <span className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    Absent
                  </span>
                  <span className="font-bold text-red-400">{stats.absent}</span>
                </div>

                <div className="flex justify-between p-3 bg-blue-500/10 rounded">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    Leave
                  </span>
                  <span className="font-bold text-blue-400">{stats.leave}</span>
                </div>

                {stats.total > 0 && (
                  <div className="pt-3 border-t flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Attendance Rate</span>
                    <Badge>
                      {Math.round((stats.present / stats.total) * 100)}%
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Overall Summary */}
      {attendance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Overall Statistics</CardTitle>
            <CardDescription>
              {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-3 gap-4">
            <div>Total Present: {attendance.filter(a => a.status === 'present').length}</div>
            <div>Total Absent: {attendance.filter(a => a.status === 'absent').length}</div>
            <div>Total Leave: {attendance.filter(a => a.status === 'leave').length}</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

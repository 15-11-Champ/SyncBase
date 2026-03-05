'use client'

import { useEffect, useMemo, useState } from 'react'
import Sidebar from '@/components/sidebar'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DollarSign, Search, Download, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { formatPrice } from '@/lib/currency'
import { useTenant } from '@/lib/tenant-context'

/**
 * NOTE: update your .env with:
 * NEXT_PUBLIC_SUPABASE_URL
 * NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

interface StaffRow {
  id: string
  name: string
  role?: string
}

interface StaffPayroll {
  id: string
  staff_id: string
  staff_name?: string
  staff_role?: string
  month?: number
  year?: number
  baseSalary: number
  attendanceDays?: number
  requiredDays?: number
  commission: number
  bonuses: number
  advance: number
  total_salary: number // stored in DB as total_salary
  deductions: number
  created_at?: string
  paymentStatus?: 'paid' | 'pending' | 'processing'
}

export default function PayrollManagement() {
  const { currentTenant } = useTenant()
  const supabase = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  ), [])
  // UI state
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [sortField, setSortField] = useState<keyof StaffPayroll | 'staff_name'>('staff_name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showAlerts, setShowAlerts] = useState(true)

  // Add Payroll modal state
  const [addPayrollOpen, setAddPayrollOpen] = useState(false)
  const [staffList, setStaffList] = useState<StaffRow[]>([])
  const [staffQuery, setStaffQuery] = useState('')
  const [selectedStaff, setSelectedStaff] = useState<StaffRow | null>(null)

  const [newPayroll, setNewPayroll] = useState({
    baseSalary: '',
    attendance: '', // e.g. "4/26" (read-only)
    commission: '',
    advance: '',
    bonuses: '',
    deductions: '',
    totalAmount: '',
  })

  const [loading, setLoading] = useState(false)
  const [payrollData, setPayrollData] = useState<StaffPayroll[]>([])

  // Edit modal state
  const [editPayrollOpen, setEditPayrollOpen] = useState(false)
  const [editingPayroll, setEditingPayroll] = useState<StaffPayroll | null>(null)
  const [editForm, setEditForm] = useState({
    baseSalary: '',
    commission: '',
    bonuses: '',
    advance: '',
    deductions: '',
    totalAmount: '',
  });

  // Derived metrics
  const totalPayroll = payrollData.reduce((sum, p) => sum + (p.total_salary || 0), 0)
  const totalCommission = payrollData.reduce((sum, p) => sum + (p.commission || 0), 0)
  const totalBonuses = payrollData.reduce((sum, p) => sum + (p.bonuses || 0), 0)
  const paidStaff = payrollData.filter(s => s.paymentStatus === 'paid').length
  const pendingStaff = payrollData.filter(s => s.paymentStatus === 'pending').length
  const processingStaff = payrollData.filter(s => s.paymentStatus === 'processing').length
  const missingAttendance = payrollData.filter(s => (s.attendanceDays || 0) < (s.requiredDays || 0))


  const autoTotal =
    Number(newPayroll.baseSalary || 0) +
    Number(newPayroll.commission || 0) +
    Number(newPayroll.bonuses || 0) -
    Number(newPayroll.advance || 0) -
    Number(newPayroll.deductions || 0);


  // -------------------------
  // Core fetch functions
  // -------------------------
  async function fetchPayroll() {
    setLoading(true)
    try {
      const [yearStr, monthStr] = selectedMonth.split('-')
      const year = Number(yearStr)
      const month = Number(monthStr)

      if (!currentTenant) return;

      const { data, error } = await supabase
        .from('staff_payroll')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('year', year)
        .eq('month', month)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading payroll:', error)
        setPayrollData([])
        setLoading(false)
        return
      }

      const mapped = (data || []).map((r: any) => {
        const staff = staffList.find((s) => s.id === r.staff_id)
        return {
          id: r.id,
          staff_id: r.staff_id,
          staff_name: staff?.name || r.staff_name || 'Unknown',
          staff_role: staff?.role || r.staff_role || '—',
          month: r.month,
          year: r.year,
          baseSalary: Number(r.base_salary || 0),
          attendanceDays: Number(r.attendance_days || 0),
          requiredDays: Number(r.required_days || 0),
          commission: Number(r.commission || 0),
          bonuses: Number(r.bonus || 0),
          advance: Number(r.advance || 0),
          total_salary: Number(r.total_salary || 0),
          deductions: Number(r.deductions || 0),
          created_at: r.created_at,
          paymentStatus: r.payment_status || 'pending',
        } as StaffPayroll
      })

      setPayrollData(mapped)
    } catch (err) {
      console.error('Unexpected error fetching payroll:', err)
      setPayrollData([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceForMonth = async (staffId: string, monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const startDate = `${year}-${month}-01`
    const nextMonth = month === '12'
      ? `${Number(year) + 1}-01-01`
      : `${year}-${String(Number(month) + 1).padStart(2, '0')}-01`

    try {
      if (!currentTenant) return { present: 0, total: 0 };

      const { data, error } = await supabase
        .from('staff_attendance')
        .select('id, date, status')
        .eq('tenant_id', currentTenant.id)
        .eq('staff_id', staffId)
        .gte('date', startDate)
        .lt('date', nextMonth)

      console.debug('DEBUG: Attendance Query Filters:', { staffId, startDate, nextMonth })
      console.debug('DEBUG: Supabase returned data:', data, 'error:', error)

      if (error) {
        console.error('Error fetching attendance:', error)
        return { present: 0, total: 0 }
      }
      if (!data || data.length === 0) {
        return { present: 0, total: 0 }
      }

      const presentDays = data.filter((d: any) => (d.status || '').toLowerCase() === 'present').length
      const totalDays = data.length
      return { present: presentDays, total: totalDays }
    } catch (err) {
      console.error('Unexpected attendance fetch error:', err)
      return { present: 0, total: 0 }
    }
  }

  // -------------------------
  // Initial data load
  // -------------------------
  useEffect(() => {
    const fetchStaff = async () => {
      if (!currentTenant) return
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, role')
        .eq('tenant_id', currentTenant.id)
        .order('name')
      if (error) {
        console.error('Error fetching staff:', error.message || error)
      } else {
        setStaffList(data || [])
      }
    }
    fetchStaff()
  }, [currentTenant])

  // refetch payroll when month or staffList changes
  useEffect(() => {
    if (staffList.length >= 0) {
      fetchPayroll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, staffList])

  // -------------------------
  // Filtering + sorting for display table
  // -------------------------
  const filteredPayroll = payrollData
    .filter(staff => {
      const matchesSearch = (staff.staff_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = filterRole === 'all' || (staff.staff_role || '').toLowerCase() === filterRole.toLowerCase()
      const matchesStatus = filterStatus === 'all' || (staff.paymentStatus || '') === filterStatus
      return matchesSearch && matchesRole && matchesStatus
    })
    .sort((a, b) => {
      const field = sortField as keyof StaffPayroll
      const aVal: any = field === 'staff_name' ? a.staff_name : (a as any)[field]
      const bVal: any = field === 'staff_name' ? b.staff_name : (b as any)[field]

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      return 0
    })

  // -------------------------
  // Handlers
  // -------------------------
  const handleSort = (field: keyof StaffPayroll | 'staff_name') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field as any)
      setSortDirection('asc')
    }
  }

  const exportPayrollReport = () => {
    const headers = ['Name', 'Role', 'Base Salary', 'Attendance', 'Commission', 'Bonuses', 'Advance', 'Total Salary', 'Deductions', 'Status']
    const rows = filteredPayroll.map(staff => [
      staff.staff_name || '',
      staff.staff_role || '',
      staff.baseSalary,
      `${staff.attendanceDays || 0}/${staff.requiredDays || 0}`,
      staff.commission,
      staff.bonuses,
      staff.advance,
      staff.total_salary,
      staff.deductions,
      staff.paymentStatus,
    ])

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `payroll-report-${selectedMonth}.csv`
    link.click()
  }

  // Save payroll to DB
  // Save payroll to DB
  const handleSavePayroll = async () => {
    if (!selectedStaff) {
      alert('Please select a staff member.')
      return
    }

    const [yearStr, monthStr] = selectedMonth.split('-')
    const year = Number(yearStr)
    const month = Number(monthStr)

    const { present, total } = await fetchAttendanceForMonth(selectedStaff.id, selectedMonth)

    const payload = {
      staff_id: selectedStaff.id,
      month,
      year,
      base_salary: Number(newPayroll.baseSalary || 0),
      commission: Number(newPayroll.commission || 0),
      bonus: Number(newPayroll.bonuses || 0),
      deductions: Number(newPayroll.deductions || 0),
      advance: Number(newPayroll.advance || 0),
      attendance_days: present,
      required_days: total,
      total_salary: Number(newPayroll.totalAmount || autoTotal),
      payment_status: 'pending',
    }

    setLoading(true)
    const { error } = await supabase.from('staff_payroll').insert([payload])

    if (error) {
      console.error('Error inserting payroll:', error)
      alert('Failed to add payroll.')
      setLoading(false)
      return
    }

    await fetchPayroll()
    setAddPayrollOpen(false)
  }



  // Update payroll status
  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('staff_payroll')
      .update({ payment_status: newStatus })
      .eq('id', id)

    if (error) {
      console.error('Status update failed:', error)
      return
    }

    await fetchPayroll()
  }

  // -------------------------
  // Edit payroll flow (open modal & save)
  // -------------------------
  const openEditModal = (row: StaffPayroll) => {
    setEditingPayroll(row)
    // prefill editForm values
    setEditForm({
      baseSalary: String(row.baseSalary ?? 0),
      commission: String(row.commission ?? 0),
      bonuses: String(row.bonuses ?? 0),
      advance: String(row.advance ?? 0),
      deductions: String(row.deductions ?? 0),
      totalAmount: String(row.total_salary ?? 0),
    })
    setEditPayrollOpen(true)
  }

  // live calculated total for edit modal
  const editAutoTotal = useMemo(() => {
    return (
      Number(editForm.baseSalary || 0) +
      Number(editForm.commission || 0) +
      Number(editForm.bonuses || 0) -
      Number(editForm.advance || 0) -
      Number(editForm.deductions || 0)
    )
  }, [editForm])

  const handleSaveEdit = async () => {
    if (!editingPayroll) return
    setLoading(true)

    const payload: any = {
      base_salary: Number(editForm.baseSalary || 0),
      commission: Number(editForm.commission || 0),
      bonus: Number(editForm.bonuses || 0),
      advance: Number(editForm.advance || 0),
      deductions: Number(editForm.deductions || 0),
      total_salary: Number(editForm.totalAmount || editAutoTotal),
    }

    const { error } = await supabase
      .from('staff_payroll')
      .update(payload)
      .eq('id', editingPayroll.id)

    if (error) {
      console.error('Edit save failed:', error)
      alert('Failed to save edits. See console.')
      setLoading(false)
      return
    }

    // refresh table
    await fetchPayroll()
    setEditPayrollOpen(false)
    setEditingPayroll(null)
    setLoading(false)
  }

  // Filtered staff for search dropdown
  const filteredStaff = staffQuery.trim()
    ? staffList.filter(s =>
      s.name.toLowerCase().includes(staffQuery.toLowerCase()) ||
      (s.role || '').toLowerCase().includes(staffQuery.toLowerCase())
    )
    : staffList.slice(0, 20);


  // Auto-fetch attendance for add modal whenever selectedStaff or selectedMonth changes
  useEffect(() => {
    const loadAttendance = async () => {
      if (!selectedStaff) return
      const { present, total } = await fetchAttendanceForMonth(selectedStaff.id, selectedMonth)
      setNewPayroll(prev => ({ ...prev, attendance: `${present}/${total}` }))
    }
    loadAttendance()
  }, [selectedStaff, selectedMonth])

  // auto total for add modal (calculated but editable)
  const addAutoTotal = useMemo(() => {
    return (
      Number(newPayroll.baseSalary || 0) +
      Number(newPayroll.commission || 0) +
      Number(newPayroll.bonuses || 0) -
      Number(newPayroll.advance || 0) -
      Number(newPayroll.deductions || 0)
    )
  }, [newPayroll])

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="flex h-screen bg-background">


      <div className="flex-1 p-6 overflow-auto">
        <div className="space-y-6">


          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Payroll Management</h1>
              <p className="text-muted-foreground mt-1">Track and manage staff compensation</p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-40"
              />

              <Button onClick={exportPayrollReport} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </Button>

              <Dialog open={addPayrollOpen} onOpenChange={setAddPayrollOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#4169E1] hover:bg-[#3256b4] text-white gap-2">
                    Add Payroll
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Payroll</DialogTitle>
                    <div className="text-sm text-muted-foreground">Enter payroll details for the selected staff member</div>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* Staff searchable selector */}
                    {/* Staff searchable selector */}
                    <div>
                      <p className="text-sm mb-1">Staff (search)</p>
                      <div className="relative">
                        <Input
                          placeholder="Type name or position..."
                          value={staffQuery}
                          onChange={(e) => setStaffQuery(e.target.value)}
                          onFocus={() => setStaffQuery(staffQuery)} // force dropdown open
                        />

                        {filteredStaff.length > 0 && (
                          <div className="absolute z-50 left-0 right-0 bg-white border rounded mt-1 max-h-48 overflow-auto shadow-sm">
                            {filteredStaff.map(s => (
                              <div
                                key={s.id}
                                className="p-2 hover:bg-slate-50 cursor-pointer"
                                onClick={() => {
                                  setSelectedStaff(s)
                                  setStaffQuery(s.name + (s.role ? ` — ${s.role}` : ''))
                                }}
                              >
                                <div className="font-medium">{s.name}</div>
                                <div className="text-xs text-muted-foreground">{s.role}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {selectedStaff && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            Selected: <span className="font-medium">{selectedStaff.name}</span>
                            {selectedStaff.role ? ` — ${selectedStaff.role}` : ''}
                          </div>
                        )}
                      </div>
                    </div>


                    {/* Base Salary */}
                    <div>
                      <p className="text-sm mb-1">Base Salary</p>
                      <Input
                        type="number"
                        value={newPayroll.baseSalary ?? ''}
                        onChange={(e) => setNewPayroll({ ...newPayroll, baseSalary: e.target.value })}
                        placeholder="Base Salary"
                      />
                    </div>

                    {/* Attendance (auto) */}
                    <div>
                      <p className="text-sm mb-1">Attendance (Auto)</p>
                      <Input
                        value={newPayroll.attendance ?? ''}
                        disabled
                        className="bg-gray-100"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Auto-fetched from attendance records</p>
                    </div>

                    {/* Commission */}
                    <div>
                      <p className="text-sm mb-1">Commission</p>
                      <Input
                        type="number"
                        value={newPayroll.commission ?? ''}
                        onChange={(e) => setNewPayroll({ ...newPayroll, commission: e.target.value })}
                        placeholder="0"
                      />
                    </div>

                    {/* Advance */}
                    <div>
                      <p className="text-sm mb-1">Advance</p>
                      <Input
                        type="number"
                        value={newPayroll.advance ?? ''}
                        onChange={(e) => setNewPayroll({ ...newPayroll, advance: e.target.value })}
                        placeholder="0"
                      />
                    </div>

                    {/* Bonuses */}
                    <div>
                      <p className="text-sm mb-1">Bonuses</p>
                      <Input
                        type="number"
                        value={newPayroll.bonuses ?? ''}
                        onChange={(e) => setNewPayroll({ ...newPayroll, bonuses: e.target.value })}
                        placeholder="0"
                      />
                    </div>

                    {/* Deductions */}
                    <div>
                      <p className="text-sm mb-1">Deductions</p>
                      <Input
                        type="number"
                        value={newPayroll.deductions ?? ''}
                        onChange={(e) => setNewPayroll({ ...newPayroll, deductions: e.target.value })}
                        placeholder="0"
                      />
                    </div>

                    {/* Total Amount */}
                    <div>
                      <p className="text-sm mb-1">Total Amount</p>
                      <Input
                        type="number"
                        value={newPayroll.totalAmount || String(addAutoTotal)}
                        onChange={(e) => setNewPayroll({ ...newPayroll, totalAmount: e.target.value })}
                        placeholder="Calculated amount"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Auto-calculated: {formatPrice(addAutoTotal)} (editable)</p>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => {
                        setAddPayrollOpen(false)
                        setSelectedStaff(null)
                        setStaffQuery('')
                      }}>
                        Cancel
                      </Button>
                      <Button
                        className="flex-1 bg-[#228B22] hover:bg-[#1a6b1a] text-white"
                        onClick={handleSavePayroll}
                        disabled={loading}
                      >
                        Save Payroll
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Payroll (Monthly)</p>
                    <p className="text-2xl font-bold mt-2">{formatPrice(totalPayroll)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{paidStaff} paid, {pendingStaff} pending</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-[#228B22] opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Pending Payroll Approvals</p>
                <p className="text-2xl font-bold mt-2">{pendingStaff + processingStaff} staff</p>
                <p className="text-xs text-muted-foreground mt-1">{pendingStaff} pending, {processingStaff} processing</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Advance Salary Liability</p>
                <p className="text-2xl font-bold mt-2">{formatPrice(payrollData.reduce((sum, staff) => sum + (staff.advance || 0), 0))}</p>
                <p className="text-xs text-muted-foreground mt-1">Total advance taken</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Absence Summary</p>
                <p className="text-2xl font-bold mt-2">
                  {payrollData.reduce((sum, s) => sum + Math.max(0, ((s.requiredDays || 0) - (s.attendanceDays || 0))), 0)} days
                </p>
                <p className="text-xs text-muted-foreground mt-1">Total staff absences</p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Staff Payroll Details</CardTitle>
              <CardDescription>Detailed payroll breakdown for all staff members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {Array.from(new Set(staffList.map(s => s.role))).filter(Boolean).map(pos => (
                      <SelectItem key={pos} value={pos || 'all'}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('staff_name' as any)}>
                        <div className="flex items-center gap-1">
                          Name
                          {sortField === 'staff_name' && (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                        </div>
                      </TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('baseSalary' as any)}>
                        <div className="flex items-center gap-1">Base Salary</div>
                      </TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('commission' as any)}>
                        <div className="flex items-center gap-1">Commission</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('bonuses' as any)}>
                        <div className="flex items-center gap-1">Bonuses</div>
                      </TableHead>
                      <TableHead>Advance</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('total_salary' as any)}>
                        <div className="flex items-center gap-1">Total Salary</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('deductions' as any)}>
                        <div className="flex items-center gap-1">Deductions</div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Edit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayroll.length > 0 ? (
                      filteredPayroll.map(staff => (
                        <TableRow key={staff.id}>
                          <TableCell className="font-medium">{staff.staff_name}</TableCell>
                          <TableCell>{staff.staff_role}</TableCell>
                          <TableCell>{formatPrice(staff.baseSalary)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {staff.attendanceDays}/{staff.requiredDays}
                              {(staff.attendanceDays || 0) < (staff.requiredDays || 0) && <AlertTriangle className="w-3 h-3 text-orange-500" />}
                            </div>
                          </TableCell>
                          <TableCell className="text-[#228B22]">{formatPrice(staff.commission || 0)}</TableCell>
                          <TableCell className="text-[#228B22]">{formatPrice(staff.bonuses || 0)}</TableCell>
                          <TableCell className="text-red-500">{formatPrice(staff.advance || 0)}</TableCell>
                          <TableCell className="font-semibold">{formatPrice(staff.total_salary || 0)}</TableCell>
                          <TableCell className="font-semibold">{formatPrice(staff.deductions || 0)}</TableCell>
                          <TableCell>
                            <Select value={staff.paymentStatus} onValueChange={(value) => updateStatus(staff.id, value)}>
                              <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => openEditModal(staff)}>Edit</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-muted-foreground py-8">No staff members found matching your filters</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Edit Payroll Modal (rendered in page tree) */}
          <Dialog open={editPayrollOpen} onOpenChange={setEditPayrollOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Payroll</DialogTitle>
                <div className="text-sm text-muted-foreground">Edit payroll details for the selected staff (attendance is read-only)</div>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                <div>
                  <p className="text-sm mb-1">Staff</p>
                  <div className="font-medium">{editingPayroll?.staff_name} {editingPayroll?.staff_role ? `— ${editingPayroll.staff_role}` : ''}</div>
                </div>

                <div>
                  <p className="text-sm mb-1">Attendance (Auto)</p>
                  <Input value={`${editingPayroll?.attendanceDays ?? 0}/${editingPayroll?.requiredDays ?? 0}`} disabled className="bg-gray-100" />
                </div>

                <div>
                  <p className="text-sm mb-1">Base Salary</p>
                  <Input type="number" value={editForm.baseSalary ?? ''} onChange={(e) => setEditForm({ ...editForm, baseSalary: e.target.value })} />
                </div>
                <div>
                  <p className="text-sm mb-1">Commission</p>
                  <Input type="number" value={editForm.commission ?? ''} onChange={(e) => setEditForm({ ...editForm, commission: e.target.value })} />
                </div>
                <div>
                  <p className="text-sm mb-1">Bonuses</p>
                  <Input type="number" value={editForm.bonuses ?? ''} onChange={(e) => setEditForm({ ...editForm, bonuses: e.target.value })} />
                </div>
                <div>
                  <p className="text-sm mb-1">Advance</p>
                  <Input type="number" value={editForm.advance ?? ''} onChange={(e) => setEditForm({ ...editForm, advance: e.target.value })} />
                </div>
                <div>
                  <p className="text-sm mb-1">Deductions</p>
                  <Input type="number" value={editForm.deductions ?? ''} onChange={(e) => setEditForm({ ...editForm, deductions: e.target.value })} />
                </div>
                <div>
                  <p className="text-sm mb-1">Total Amount</p>
                  <Input type="number" value={editForm.totalAmount ?? String(editAutoTotal)} onChange={(e) => setEditForm({ ...editForm, totalAmount: e.target.value })} />
                  <p className="text-xs text-muted-foreground mt-1">Auto-calculated: {formatPrice(editAutoTotal)} (editable)</p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setEditPayrollOpen(false); setEditingPayroll(null); }}>
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-[#228B22] hover:bg-[#1a6b1a] text-white" onClick={handleSaveEdit} disabled={loading}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}

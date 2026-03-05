'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useTenant } from '@/lib/tenant-context'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from '@/components/ui/input'
import { CheckCircle2, XCircle, Clock, Edit2 } from 'lucide-react'

interface StaffMember {
  id: string
  name: string
  role: string
}

interface AttendanceEntry {
  id?: string
  staff_id: string
  date: string
  status: 'present' | 'absent' | 'leave'
  check_in_time?: string | null
  check_out_time?: string | null
}

const today = new Date().toISOString().split('T')[0]

export default function StaffAttendance() {
  const { currentTenant, isLoading: isTenantLoading } = useTenant()
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([])

  const [editingEntry, setEditingEntry] = useState<AttendanceEntry | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(today)

  const loadStaff = async () => {
    if (!currentTenant) return
    const { data } = await supabase
      .from('staff')
      .select('id, name, role')
      .eq('tenant_id', currentTenant.id)

    if (data) setStaffList(data)
  }

  const loadAttendance = async () => {
    if (!currentTenant) return
    const { data } = await supabase
      .from('staff_attendance')
      .select('*')
      .eq('tenant_id', currentTenant.id)
      .eq('date', selectedDate)

    if (data) setAttendance(data)
  }

  useEffect(() => {
    if (!isTenantLoading) {
      loadStaff()
    }
  }, [currentTenant, isTenantLoading])

  useEffect(() => {
    loadAttendance()
  }, [selectedDate])

  const getAttendanceStatus = (staffId: string) =>
    attendance.find(a => a.staff_id === staffId)

  // ✅ OPTION B: Present without time requirement
  const upsertAttendance = async (staffId: string, status: 'present' | 'absent' | 'leave') => {
    console.log('CLICK:', { staffId, status })

    const current = getAttendanceStatus(staffId)

    const payload: any = {
      tenant_id: currentTenant!.id,
      staff_id: staffId,
      date: selectedDate,
      status,
      check_in_time: null,
      check_out_time: null,
    }

    console.log('PAYLOAD:', payload)

    const res = current?.id
      ? await supabase.from('staff_attendance').update(payload).eq('id', current.id).eq('tenant_id', currentTenant!.id)
      : await supabase.from('staff_attendance').insert([payload])

    console.log('DB RESPONSE:', res)

    loadAttendance()
  }


  const saveEditedAttendance = async () => {
    if (!editingEntry?.id || !currentTenant) return

    await supabase
      .from('staff_attendance')
      .update({
        status: editingEntry.status,
        check_in_time: editingEntry.check_in_time || null,
        check_out_time: editingEntry.check_out_time || null,
      })
      .eq('id', editingEntry.id)
      .eq('tenant_id', currentTenant.id)

    setEditDialogOpen(false)
    setEditingEntry(null)
    loadAttendance()
  }

  const todayAttendance = attendance

  if (isTenantLoading) {
    return <div className="space-y-6 flex items-center justify-center h-64">Loading...</div>
  }

  if (!currentTenant) {
    return <div className="space-y-6 flex items-center justify-center h-64">No tenant selected</div>
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-foreground">Staff Attendance</h1>
        <p className="text-muted-foreground mt-2">Mark and manage daily staff attendance</p>
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-foreground">Select Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="px-3 py-2 bg-input border border-border rounded-md text-foreground"
        />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffList.map(staff => {
          const entry = getAttendanceStatus(staff.id)

          return (
            <Card key={staff.id}>
              <CardHeader>
                <div className="flex justify-between">
                  <div>
                    <CardTitle>{staff.name}</CardTitle>
                    <CardDescription>{staff.role}</CardDescription>
                  </div>
                  {entry && (
                    <Badge className={
                      entry.status === 'present' ? 'bg-green-500/20 text-green-400' :
                        entry.status === 'absent' ? 'bg-red-500/20 text-red-400' :
                          'bg-blue-500/20 text-blue-400'
                    }>
                      {entry.status}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">

                {entry?.status === 'present' && (
                  <div className="text-sm bg-green-500/10 p-3 rounded border border-green-500/20">
                    {entry.check_in_time ? <p>Check-in: {entry.check_in_time}</p> : <p>Marked Present</p>}
                    {entry.check_out_time && <p>Check-out: {entry.check_out_time}</p>}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" onClick={() => upsertAttendance(staff.id, 'present')}>
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={() => upsertAttendance(staff.id, 'absent')}>
                    <XCircle className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={() => upsertAttendance(staff.id, 'leave')}>
                    <Clock className="w-4 h-4" />
                  </Button>

                  {entry && (
                    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingEntry(entry)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>

                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Attendance</DialogTitle>
                          <DialogDescription>{staff.name}</DialogDescription>
                        </DialogHeader>

                        <Select
                          value={editingEntry?.status}
                          onValueChange={v =>
                            setEditingEntry(prev => prev ? { ...prev, status: v as any } : prev)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="leave">Leave</SelectItem>
                          </SelectContent>
                        </Select>

                        {editingEntry?.status === 'present' && (
                          <>
                            <Input
                              type="time"
                              value={editingEntry.check_in_time || ''}
                              onChange={e =>
                                setEditingEntry(prev => prev ? { ...prev, check_in_time: e.target.value } : prev)
                              }
                            />
                            <Input
                              type="time"
                              value={editingEntry.check_out_time || ''}
                              onChange={e =>
                                setEditingEntry(prev => prev ? { ...prev, check_out_time: e.target.value } : prev)
                              }
                            />
                          </>
                        )}

                        <Button onClick={saveEditedAttendance}>Save Changes</Button>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div>Present: {todayAttendance.filter(a => a.status === 'present').length}</div>
          <div>Absent: {todayAttendance.filter(a => a.status === 'absent').length}</div>
          <div>Leave: {todayAttendance.filter(a => a.status === 'leave').length}</div>
        </CardContent>
      </Card>

    </div>
  )
}

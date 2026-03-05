'use client';

import { useEffect, useState } from 'react'
import AddAppointmentForm from '@/components/add-appointment-form'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import {
  Search,
  Clock,
  CheckCircle2,
  User,
  Scissors,
  Phone,
  Mail,
  MoreVertical,
  Trash2,
  Check,
} from 'lucide-react'

import { supabase } from '@/lib/supabaseClient'
import { useTenant } from '@/lib/tenant-context'

export default function BookAppointmentsPage() {
  const { currentTenant, isLoading: isTenantLoading } = useTenant()
  const [appointments, setAppointments] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming')

  // 🔥 Load Appointments From Supabase
  const loadAppointments = async () => {
    if (!currentTenant) return

    const { data, error } = await supabase
      .from('appointments')
      .select('*, clients(full_name, email, phone), staff(name)')
      .eq('tenant_id', currentTenant.id)
      .order('date', { ascending: true })

    if (!error && data) {
      const formatted = data.map((apt: any) => ({
        id: apt.id,
        clientName: apt.clients?.full_name || '',
        clientEmail: apt.clients?.email || '',
        clientPhone: apt.clients?.phone || '',
        staffName: apt.staff?.name || '',
        serviceName: apt.service_name,
        servicePrice: apt.service_price,
        appointmentDate: apt.date,
        appointmentTime: apt.time,
        status: apt.status,
      }))
      setAppointments(formatted)
    }
  }

  useEffect(() => {
    if (!isTenantLoading) {
      loadAppointments()
    }
  }, [currentTenant, isTenantLoading])

  const handleBookingSuccess = () => {
    loadAppointments()
  }

  const handleMarkComplete = async (id: string) => {
    if (!currentTenant) return
    await supabase.from('appointments').update({ status: 'completed' }).eq('id', id).eq('tenant_id', currentTenant.id)
    loadAppointments()
  }

  const handleDelete = async (id: string) => {
    if (!currentTenant) return
    await supabase.from('appointments').delete().eq('id', id).eq('tenant_id', currentTenant.id)
    loadAppointments()
  }

  const filteredAppointments = appointments
    .filter(a => a.status === activeTab)
    .filter(a =>
      a.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.clientPhone.includes(searchQuery)
    )

  const upcomingCount = appointments.filter(a => a.status === 'upcoming').length
  const completedCount = appointments.filter(a => a.status === 'completed').length

  if (isTenantLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>
  }

  if (!currentTenant) {
    return <div className="flex-1 flex items-center justify-center">No tenant selected</div>
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Book Appointments</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage all booked and completed appointments
            </p>
          </div>

          {/* Supabase Form */}
          <AddAppointmentForm onSuccess={handleBookingSuccess} />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">
                  Upcoming Appointments
                </p>
                <p className="text-3xl font-bold mt-2 text-primary">{upcomingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-primary/30" />
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">
                  Completed Appointments
                </p>
                <p className="text-3xl font-bold mt-2 text-green-500">{completedCount}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500/30" />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-3 font-medium text-sm ${activeTab === 'upcoming'
              ? 'text-primary border-b-2 border-primary -mb-1'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Upcoming ({upcomingCount})
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-3 font-medium text-sm ${activeTab === 'completed'
              ? 'text-primary border-b-2 border-primary -mb-1'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by client name, service, or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 bg-input border-border text-foreground"
          />
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <Card className="p-12 text-center bg-card border-border">
              <p className="text-muted-foreground">
                {activeTab === 'upcoming'
                  ? 'No upcoming appointments'
                  : 'No completed appointments'}
              </p>
            </Card>
          ) : (
            filteredAppointments.map(appointment => (
              <Card key={appointment.id} className="p-6 bg-card border-border">
                <div className="flex items-start justify-between gap-6">

                  {/* Status */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${appointment.status === 'completed'
                        ? 'bg-green-500/20'
                        : 'bg-primary/20'
                        }`}
                    >
                      {appointment.status === 'completed' ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : (
                        <Clock className="w-6 h-6 text-primary" />
                      )}
                    </div>

                    <div>
                      <p className="text-sm uppercase tracking-wide text-muted-foreground">
                        {new Date(appointment.appointmentDate).toDateString()}
                      </p>

                      <p className="text-lg font-semibold text-foreground mt-1">
                        {appointment.appointmentTime}
                      </p>

                      <Badge
                        className={`mt-2 ${appointment.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-primary/20 text-primary'
                          }`}
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Client, service, staff */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">Client</p>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {appointment.clientName}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <a href={`tel:${appointment.clientPhone}`} className="text-xs text-primary">
                              <Phone className="w-3 h-3" />
                            </a>
                            <a href={`mailto:${appointment.clientEmail}`} className="text-xs text-primary">
                              <Mail className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">Service</p>
                      <div className="flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-primary" />
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {appointment.serviceName}
                          </p>
                          <p className="text-xs text-primary font-semibold">
                            ₹{appointment.servicePrice}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">Staff</p>
                      <p className="font-medium text-foreground text-sm">
                        {appointment.staffName}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-muted-foreground">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="bg-card border-border">
                      {appointment.status === 'upcoming' && (
                        <DropdownMenuItem
                          onClick={() => handleMarkComplete(appointment.id)}
                          className="text-green-500 cursor-pointer"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Mark Complete
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        onClick={() => handleDelete(appointment.id)}
                        className="text-destructive cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

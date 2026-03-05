'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CheckCircle2, Clock, User, Scissors, MoreVertical, Phone, Mail, Edit2, Trash2 } from 'lucide-react'
import AddAppointmentForm from '@/components/add-appointment-form'

interface Appointment {
  id: string
  clientName: string
  staffName: string
  serviceName: string
  time: string
  duration: number
  status: 'upcoming' | 'in-progress' | 'completed'
  servicePrice: number
  clientEmail?: string
  clientPhone?: string
}

const mockAppointments: Appointment[] = [
  {
    id: '1',
    clientName: 'Sarah Johnson',
    staffName: 'Marcus',
    serviceName: 'Haircut & Fade',
    time: '09:30 AM',
    duration: 45,
    status: 'in-progress',
    servicePrice: 45,
    clientEmail: 'sarah@example.com',
    clientPhone: '(555) 123-4567',
  },
  {
    id: '2',
    clientName: 'Emma Davis',
    staffName: 'Jessica',
    serviceName: 'Blow Dry Style',
    time: '10:30 AM',
    duration: 60,
    status: 'upcoming',
    servicePrice: 55,
    clientEmail: 'emma@example.com',
    clientPhone: '(555) 234-5678',
  },
  {
    id: '3',
    clientName: 'Michael Brown',
    staffName: 'Marcus',
    serviceName: 'Full Color Treatment',
    time: '11:45 AM',
    duration: 90,
    status: 'upcoming',
    servicePrice: 120,
    clientEmail: 'michael@example.com',
    clientPhone: '(555) 345-6789',
  },
]

export default function AppointmentDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments)
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null)

  const handleMarkComplete = (id: string) => {
    setAppointments(prev =>
      prev.map(apt =>
        apt.id === id ? { ...apt, status: 'completed' } : apt
      )
    )
  }

  const handleMarkInProgress = (id: string) => {
    setAppointments(prev =>
      prev.map(apt =>
        apt.id === id ? { ...apt, status: 'in-progress' } : apt
      )
    )
  }

  const handleDelete = (id: string) => {
    setAppointments(prev => prev.filter(apt => apt.id !== id))
  }

  const handleAppointmentCreated = (newAppointment: any) => {
    const createdAppointment: Appointment = {
      id: newAppointment.appointmentId || `APT-${Date.now()}`,
      clientName: newAppointment.bookingConfirmation?.clientName || 'New Client',
      staffName: newAppointment.bookingConfirmation?.staffName || 'Staff',
      serviceName: newAppointment.bookingConfirmation?.serviceName || 'Service',
      time: newAppointment.bookingConfirmation?.appointmentTime || '00:00 AM',
      duration: 60,
      status: 'upcoming',
      servicePrice: parseInt(String(newAppointment.bookingConfirmation?.totalPrice || '0').replace(/[^\d]/g, '')) || 0,
    }
    setAppointments([...appointments, createdAppointment])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'bg-primary text-primary-foreground'
      case 'completed':
        return 'bg-green-500/20 text-green-400'
      case 'upcoming':
        return 'bg-muted text-muted-foreground'
      default:
        return 'bg-border text-foreground'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-progress':
        return <Clock className="w-4 h-4" />
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />
      default:
        return null
    }
  }

  const stats = [
    {
      label: 'Today\'s Appointments',
      value: appointments.length,
      color: 'text-primary',
    },
    {
      label: 'In Progress',
      value: appointments.filter(a => a.status === 'in-progress').length,
      color: 'text-primary',
    },
    {
      label: 'Completed',
      value: appointments.filter(a => a.status === 'completed').length,
      color: 'text-green-400',
    },
    {
      label: 'Revenue Today',
      value: `₹${appointments.reduce((acc, a) => acc + a.servicePrice, 0)}`,
      color: 'text-primary',
    },
  ]

  return (
    <div className="p-8 space-y-8">
      {/* Stats Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your daily schedule</p>
        </div>
        <AddAppointmentForm onSuccess={handleAppointmentCreated} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 bg-card border-border">
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
            <p className={`text-3xl font-bold mt-2 ${stat.color}`}>
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Timeline View */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Appointment Timeline</h2>
        
        {appointments.length === 0 ? (
          <Card className="p-12 bg-card border-border text-center">
            <p className="text-muted-foreground">No appointments scheduled</p>
          </Card>
        ) : (
          appointments.map((appointment, index) => (
            <Card
              key={appointment.id}
              className={`p-6 bg-card border-border hover:border-primary/50 transition-all cursor-pointer ${
                selectedAppointment === appointment.id ? 'border-primary/50 ring-1 ring-primary/50' : ''
              }`}
              onClick={() => setSelectedAppointment(appointment.id)}
            >
              <div className="flex items-start justify-between gap-6">
                {/* Timeline indicator */}
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(appointment.status)}`}>
                    {getStatusIcon(appointment.status) || (
                      <Scissors className="w-5 h-5" />
                    )}
                  </div>
                  {index < appointments.length - 1 && (
                    <div className="w-1 h-12 bg-border" />
                  )}
                </div>

                {/* Appointment details */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                      Time
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {appointment.time}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {appointment.duration} min
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                      Client
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {appointment.clientName}
                        </p>
                        {selectedAppointment === appointment.id && (
                          <div className="flex gap-2 mt-1 text-xs">
                            <a href={`tel:${appointment.clientPhone}`} className="flex items-center gap-1 text-primary hover:underline">
                              <Phone className="w-3 h-3" />
                              Call
                            </a>
                            <a href={`mailto:${appointment.clientEmail}`} className="flex items-center gap-1 text-primary hover:underline">
                              <Mail className="w-3 h-3" />
                              Email
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                      Service
                    </p>
                    <p className="font-medium text-foreground">
                      {appointment.serviceName}
                    </p>
                    <p className="text-xs text-primary font-semibold">
                      ₹{appointment.servicePrice}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                      Staff
                    </p>
                    <p className="font-medium text-foreground">
                      {appointment.staffName}
                    </p>
                    <Badge className={`mt-2 ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  {appointment.status === 'upcoming' && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkInProgress(appointment.id)
                      }}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Start
                    </Button>
                  )}
                  {appointment.status === 'in-progress' && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkComplete(appointment.id)
                      }}
                      className="bg-green-500/20 hover:bg-green-500/30 text-green-400"
                    >
                      Complete
                    </Button>
                  )}
                  
                  {/* More options dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      <DropdownMenuItem className="text-foreground focus:bg-primary/10 focus:text-primary cursor-pointer flex items-center gap-2">
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(appointment.id)}
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

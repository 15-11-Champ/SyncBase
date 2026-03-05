'use client'

import { useState } from 'react'
import { useTenant } from '@/lib/tenant-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, User, Mail, Phone, Scissors, Calendar, Clock, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface BookAppointmentModalProps {
  services: Array<{ id: string; name: string; price: number; duration?: number }>
  staff: Array<{ id: string; name: string }>
  onBookingSuccess: (appointment: any) => void
}

export default function BookAppointmentModal({
  services,
  staff,
  onBookingSuccess,
}: BookAppointmentModalProps) {
  const { currentTenant } = useTenant()
  const [open, setOpen] = useState(false)
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [selectedStaff, setSelectedStaff] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!clientName || !clientEmail || !clientPhone || !selectedService || !appointmentDate || !appointmentTime) {
      setError('Please fill in all required fields')
      return
    }

    const selectedServiceObj = services.find(s => s.id === selectedService)
    if (!selectedServiceObj) {
      setError('Invalid service selected')
      return
    }

    if (!currentTenant) {
      setError('No business selected')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentTenant.id
        },
        body: JSON.stringify({
          clientName,
          clientEmail,
          clientPhone,
          serviceId: selectedService,
          serviceName: selectedServiceObj.name,
          servicePrice: selectedServiceObj.price,
          staffId: selectedStaff || null,
          date: appointmentDate,
          startTime: appointmentTime,
        })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to book')
      }

      const result = await response.json()
      onBookingSuccess(result.appointment)

      // Reset form
      setClientName('')
      setClientEmail('')
      setClientPhone('')
      setSelectedService('')
      setSelectedStaff('')
      setAppointmentDate('')
      setAppointmentTime('')
      setOpen(false)
    } catch (err: any) {
      setError(err.message || 'Operation failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="w-4 h-4" />
          Create Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create an Appointment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Client Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">Client Information</h3>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-1 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Client Name"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-1 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                placeholder="client@example.com"
                value={clientEmail}
                onChange={e => setClientEmail(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-1 mb-2">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="tel"
                placeholder="(555) 123-4567"
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Service Selection */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-primary" />
              <label className="text-sm font-medium text-foreground">
                Service <span className="text-red-500">*</span>
              </label>
            </div>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {services.map(service => (
                  <SelectItem key={service.id} value={service.id} className="text-foreground">
                    {service.name} - ₹{service.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Staff Assignment */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Assign Staff (Optional)
            </label>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue placeholder="Select staff member (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {staff.map(member => (
                  <SelectItem key={member.id} value={member.id} className="text-foreground">
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-primary" />
                <label className="text-sm font-medium text-foreground">
                  Date <span className="text-red-500">*</span>
                </label>
              </div>
              <Input
                type="date"
                value={appointmentDate}
                onChange={e => setAppointmentDate(e.target.value)}
                className="bg-input border-border text-foreground"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <label className="text-sm font-medium text-foreground">
                  Time <span className="text-red-500">*</span>
                </label>
              </div>
              <Input
                type="time"
                value={appointmentTime}
                onChange={e => setAppointmentTime(e.target.value)}
                className="bg-input border-border text-foreground"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert className="bg-red-500/10 border-red-500/20">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-400 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              onClick={() => setOpen(false)}
              variant="outline"
              className="flex-1 border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubmitting ? 'Creating...' : 'Create Appointment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

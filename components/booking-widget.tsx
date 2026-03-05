'use client'

import { useState, useEffect } from 'react'
import { useTenant } from '@/lib/tenant-context'
import { supabase } from '@/lib/supabaseClient'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarIcon, Clock, User, Scissors, AlertCircle, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { bookAppointment } from '@/lib/appointment-service'

// Types removed or updated...
interface Service {
  id: string
  name: string
  duration: number
  price: number
}

interface Staff {
  id: string
  name: string
}

export default function BookingWidget() {
  const { currentTenant, isLoading: isTenantLoading } = useTenant()
  const [services, setServices] = useState<Service[]>([])
  const [staffMembers, setStaffMembers] = useState<Staff[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)

  const [step, setStep] = useState<'service' | 'details' | 'confirmation'>('service')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [bookingConfirmation, setBookingConfirmation] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isTenantLoading && currentTenant) {
      loadData()
    }
  }, [currentTenant, isTenantLoading])

  const loadData = async () => {
    if (!currentTenant) return
    setIsDataLoading(true)
    try {
      const [sRes, stRes] = await Promise.all([
        supabase.from('services').select('*').eq('tenant_id', currentTenant.id),
        supabase.from('staff').select('id, name').eq('tenant_id', currentTenant.id)
      ])

      if (sRes.data) setServices(sRes.data)
      if (stRes.data) setStaffMembers(stRes.data)
    } finally {
      setIsDataLoading(false)
    }
  }

  // Hardcoded for now but could be dynamic
  const timeSlots = [
    { time: '09:00 AM', available: true },
    { time: '10:00 AM', available: true },
    { time: '11:00 AM', available: true },
    { time: '12:00 PM', available: true },
    { time: '01:00 PM', available: true },
    { time: '02:00 PM', available: true },
    { time: '03:00 PM', available: true },
    { time: '04:00 PM', available: true },
    { time: '05:00 PM', available: true },
  ]

  const handleSelectService = (service: Service) => {
    setSelectedService(service)
    setStep('details')
  }

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientEmail || !selectedStaff) {
      setError('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const staff = staffMembers.find(s => s.id === selectedStaff)

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentTenant!.id
        },
        body: JSON.stringify({
          clientName,
          clientEmail,
          clientPhone,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          servicePrice: selectedService.price,
          staffId: selectedStaff,
          date: selectedDate,
          startTime: selectedTime,
          duration: selectedService.duration,
        }),
      })

      if (!response.ok) throw new Error('Failed to book')
      const result = await response.json()

      setBookingConfirmation(result)
      setStep('confirmation')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create appointment')
    } finally {
      setIsLoading(false)
    }
  }

  const resetBooking = () => {
    setStep('service')
    setSelectedService(null)
    setSelectedStaff('')
    setSelectedDate('')
    setSelectedTime('')
    setClientName('')
    setClientEmail('')
    setClientPhone('')
    setBookingConfirmation(null)
    setError('')
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card className="bg-card border-border">
        {/* Header */}
        <div className="bg-primary/10 border-b border-border p-6">
          <h2 className="text-2xl font-bold text-foreground">Book an Appointment</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {currentTenant ? `At ${currentTenant.name}` : 'At Syncbase'}
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {isTenantLoading || isDataLoading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-foreground animate-pulse">Loading booking details...</p>
            </div>
          ) : !currentTenant ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-destructive opacity-50" />
              <div>
                <h3 className="text-lg font-semibold">Tenant Not Found</h3>
                <p className="text-sm text-muted-foreground">This booking link appears to be invalid or missing the organization context.</p>
              </div>
            </div>
          ) : (
            <>
              {step === 'service' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Select a Service
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {services.map(service => (
                        <button
                          key={service.id}
                          onClick={() => handleSelectService(service)}
                          className="p-4 rounded-lg border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-left"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <Scissors className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-foreground">{service.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {service.duration} minutes
                                </p>
                              </div>
                            </div>
                            <p className="font-semibold text-primary">₹{service.price}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 'details' && selectedService && (
                <div className="space-y-6">
                  {/* Service Summary */}
                  <Card className="p-4 bg-primary/5 border-primary/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Scissors className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">{selectedService.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedService.duration} min • ₹{selectedService.price}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setStep('service')}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Change
                      </Button>
                    </div>
                  </Card>

                  <div>
                    <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      Select Staff Member
                    </label>
                    <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                      <SelectTrigger className="bg-input border-border text-foreground">
                        <SelectValue placeholder="Choose a staff member *" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {staffMembers.map(staff => (
                          <SelectItem key={staff.id} value={staff.id} className="text-foreground">
                            {staff.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                      <CalendarIcon className="w-4 h-4" />
                      Select Date
                    </label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="bg-input border-border text-foreground"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* Time Selection */}
                  <div>
                    <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4" />
                      Select Time
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map((slot, index) => (
                        <button
                          key={index}
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`p-3 rounded-lg border transition-all text-sm font-medium ${!slot.available
                            ? 'border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                            : selectedTime === slot.time
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-card text-foreground hover:border-primary/50'
                            }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Client Information */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Your Information
                    </label>

                    <Input
                      placeholder="Full Name"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                    />

                    <Input
                      type="email"
                      placeholder="Email Address"
                      value={clientEmail}
                      onChange={e => setClientEmail(e.target.value)}
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                    />

                    <Input
                      type="tel"
                      placeholder="Phone Number"
                      value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  {/* Validation */}
                  {(!selectedDate || !selectedTime || !clientName || !clientEmail || !selectedStaff) && (
                    <Alert className="bg-yellow-500/10 border-yellow-500/20">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <AlertDescription className="text-yellow-400 text-sm">
                        Please fill in all required fields and select a time
                      </AlertDescription>
                    </Alert>
                  )}

                  {error && (
                    <Alert className="bg-red-500/10 border-red-500/20">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertDescription className="text-red-400 text-sm">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-border">
                    <Button
                      onClick={() => setStep('service')}
                      variant="outline"
                      className="flex-1 border-border text-foreground hover:bg-muted"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleConfirmBooking}
                      disabled={isLoading}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {isLoading ? 'Booking...' : 'Confirm Booking'}
                    </Button>
                  </div>
                </div>
              )}

              {step === 'confirmation' && bookingConfirmation && (
                <div className="space-y-6">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-green-600 mb-2">
                      Booking Confirmed!
                    </h3>
                    <p className="text-green-600/80 text-sm">
                      {bookingConfirmation.bookingConfirmation.confirmationMessage}
                    </p>
                  </div>

                  <Card className="p-4 bg-primary/5 border-primary/20 space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Appointment ID
                      </p>
                      <p className="font-mono text-sm text-foreground mt-1">
                        {bookingConfirmation.appointmentId}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/10">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Date & Time
                        </p>
                        <p className="font-medium text-foreground mt-1">
                          {bookingConfirmation.bookingConfirmation.appointmentDate}
                        </p>
                        <p className="text-sm text-primary font-semibold">
                          {bookingConfirmation.bookingConfirmation.appointmentTime}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Total Price
                        </p>
                        <p className="font-bold text-primary text-lg mt-1">
                          {bookingConfirmation.bookingConfirmation.totalPrice}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-primary/10">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                        Service Details
                      </p>
                      <p className="text-foreground font-medium">
                        {bookingConfirmation.bookingConfirmation.serviceName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Staff: {bookingConfirmation.bookingConfirmation.staffName}
                      </p>
                    </div>
                  </Card>

                  <div className="flex gap-3">
                    <Button
                      onClick={resetBooking}
                      variant="outline"
                      className="flex-1 border-border text-foreground hover:bg-muted"
                    >
                      Book Another
                    </Button>
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => resetBooking()}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-6 bg-card/50 flex items-center justify-between">
          <div className="flex gap-4 text-xs text-muted-foreground">
            {bookingConfirmation?.smsConfirmationSent && (
              <div className="flex items-center gap-1">
                <Badge className="bg-green-500/20 text-green-600">SMS Sent</Badge>
              </div>
            )}
            {bookingConfirmation?.emailConfirmationSent && (
              <div className="flex items-center gap-1">
                <Badge className="bg-green-500/20 text-green-600">Email Sent</Badge>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabaseClient'
import { useTenant } from '@/lib/tenant-context'
import { AlertCircle, Calendar, User, Scissors, Plus } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

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






function convertTo24Hour(timeStr: string) {
  if (!timeStr) return ""

  // Regex to match "HH:MM", "HH:MM AM", "HH:MM PM", "HH:MMam", "HH:MMpm"
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?:\s?([aApP][mM]))?$/)

  if (!match) return timeStr

  let hours = parseInt(match[1])
  const minutes = match[2]
  const modifier = match[3]?.toUpperCase()

  if (modifier === "PM" && hours < 12) {
    hours += 12
  } else if (modifier === "AM" && hours === 12) {
    hours = 0
  }

  const h = String(hours).padStart(2, '0')
  return `${h}:${minutes}:00`
}

interface AddAppointmentFormProps {
  onSuccess?: (appointment: any) => void
}

export default function AddAppointmentForm({ onSuccess }: AddAppointmentFormProps) {
  const { currentTenant } = useTenant()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Inputs
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [selectedStaff, setSelectedStaff] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')

  // Dynamic from DB
  const [services, setServices] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [loadingStaff, setLoadingStaff] = useState(true)

  const [serviceSearch, setServiceSearch] = useState("");
  const [showServiceList, setShowServiceList] = useState(false);

  // Fetch services
  useEffect(() => {
    async function loadServices() {
      if (!currentTenant) return
      let { data, error } = await supabase
        .from('services')
        .select('id, name, price')
        .eq('tenant_id', currentTenant.id)

      if (!error && data) setServices(data)
      setLoadingServices(false)
    }
    loadServices()
  }, [currentTenant])

  // Fetch staff
  useEffect(() => {
    async function loadStaff() {
      if (!currentTenant) return
      let { data, error } = await supabase
        .from('staff')
        .select('id, name')
        .eq('tenant_id', currentTenant.id)

      if (!error && data) setStaff(data)
      setLoadingStaff(false)
    }
    loadStaff()
  }, [currentTenant])

  const isFormValid = () =>
    clientName.trim() &&
    clientPhone.trim() &&
    selectedService &&
    selectedStaff &&
    appointmentDate &&
    appointmentTime

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) {
      setError('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      if (!currentTenant) throw new Error('No tenant selected')

      // First: find or create client
      const orQuery = clientEmail
        ? `email.eq.${clientEmail},phone.eq.${clientPhone}`
        : `phone.eq.${clientPhone}`

      const { data: existingClient } = await supabase
        .from('clients')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .or(orQuery)
        .limit(1)

      let clientId: string

      if (existingClient && existingClient.length > 0) {
        clientId = existingClient[0].id
      } else {
        const { data: newClient, error: clientErr } = await supabase
          .from('clients')
          .insert([
            {
              tenant_id: currentTenant.id,
              full_name: clientName,
              email: clientEmail || null,
              phone: clientPhone,
            }
          ])
          .select()
          .single()

        if (clientErr) throw clientErr
        clientId = newClient.id
      }

      // Get service details
      const serviceObj = services.find(s => s.id === selectedService)

      // Insert appointment
      const { error: appointmentErr } = await supabase
        .from('appointments')
        .insert([
          {
            tenant_id: currentTenant.id,
            client_id: clientId,
            staff_id: selectedStaff,
            service_id: selectedService,
            service_name: serviceObj?.name,
            service_price: serviceObj?.price,
            date: appointmentDate,
            start_time: convertTo24Hour(appointmentTime),
            status: 'upcoming',
          }
        ])

      if (appointmentErr) throw appointmentErr

      // Reset form
      setClientName('')
      setClientEmail('')
      setClientPhone('')
      setSelectedService('')
      setSelectedStaff('')
      setAppointmentDate('')
      setAppointmentTime('')

      setIsOpen(false)
      onSuccess?.({})
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to create appointment')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="w-4 h-4" />
          Add Appointment
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle>Create New Appointment</DialogTitle>
          <DialogDescription>
            Book a new appointment for a client with available staff
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* CLIENT INFO */}
          <div className="space-y-3 pt-4">
            <label className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Client Information
            </label>

            <Input placeholder="Full Name *" value={clientName} onChange={e => setClientName(e.target.value)} />
            <Input type="email" placeholder="Email Address (optional)" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
            <Input type="tel" placeholder="Phone Number *" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
          </div>

          {/* SERVICE SELECT (search + dropdown, no imports) */}
          <div className="space-y-3 pt-4 border-t border-border relative">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Scissors className="w-4 h-4 text-primary" />
              Service *
            </label>

            {/* Searchable Input */}
            <Input
              placeholder="Search service..."
              value={
                selectedService
                  ? services.find(s => s.id === selectedService)?.name +
                  " — ₹" + services.find(s => s.id === selectedService)?.price
                  : serviceSearch
              }
              onChange={(e) => {
                setSelectedService("");
                setServiceSearch(e.target.value);
                setShowServiceList(true);
              }}
              onFocus={() => setShowServiceList(true)}
              className="cursor-text"
            />

            {/* Dropdown List */}
            {showServiceList && (
              <div className="absolute left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto z-50">

                {services
                  .filter((s) =>
                    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
                  )
                  .map((service) => (
                    <div
                      key={service.id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSelectedService(service.id);
                        setServiceSearch("");
                        setShowServiceList(false);
                      }}
                    >
                      {service.name} — ₹{service.price}
                    </div>
                  ))}

                {services.filter((s) =>
                  s.name.toLowerCase().includes(serviceSearch.toLowerCase())
                ).length === 0 && (
                    <div className="px-3 py-2 text-gray-400">No services found</div>
                  )}
              </div>
            )}
          </div>


          {/* STAFF SELECT */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">Assign Staff *</label>

            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger>
                <SelectValue placeholder={loadingStaff ? 'Loading staff...' : 'Select staff'} />
              </SelectTrigger>
              <SelectContent>
                {staff.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* DATE + TIME */}
          <div className="space-y-3 pt-4 border-t border-border">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Date & Time
            </label>

            <Input type="date" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} />

            <Input
              type="text"
              placeholder="e.g. 09:30 AM"
              value={appointmentTime}
              onChange={e => setAppointmentTime(e.target.value)}
            />


          </div>

          {error && (
            <Alert className="bg-red-500/10 border-red-500/20">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-400 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>

            <Button type="submit" disabled={isLoading || !isFormValid()} className="bg-primary hover:bg-primary/90">
              {isLoading ? 'Creating...' : 'Create Appointment'}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  )
}




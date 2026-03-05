'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

interface ClientDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string | null
}

export default function ClientDetailsModal({
  isOpen,
  onClose,
  clientId
}: ClientDetailsModalProps) {

  const [client, setClient] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!clientId || !isOpen) return
    loadData()
  }, [clientId, isOpen])

  const loadData = async () => {
    setLoading(true)

    const { data: clientData } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    const { data: appts } = await supabase
      .from('appointments')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false })

    setClient(clientData)
    setAppointments(appts || [])
    setLoading(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {loading ? "Loading..." : client?.full_name || "Client Details"}
          </DialogTitle>
        </DialogHeader>

        {/* Loading state */}
        {loading && (
          <p className="text-muted-foreground py-4">Fetching client details...</p>
        )}

        {/* Show data after loading */}
        {!loading && client && (
          <div className="space-y-3">
            <p><strong>Email:</strong> {client.email}</p>
            <p><strong>Phone:</strong> {client.phone}</p>
            <p><strong>Address:</strong> {client.address}</p>

            <hr className="my-4" />

            <h3 className="font-semibold">Previous Appointments</h3>

            {appointments.length === 0 ? (
              <p className="text-muted-foreground text-sm">No appointments found</p>
            ) : (
              <ul className="space-y-2">
                {appointments.map(appt => (
                  <li key={appt.id} className="p-3 rounded border border-border">
                    <p><strong>Date:</strong> {appt.date}</p>
                    <p><strong>Time:</strong> {appt.time}</p>
                    <p><strong>Service:</strong> {appt.service_name}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

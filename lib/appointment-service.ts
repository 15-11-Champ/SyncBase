// This abstracts API calls from components

interface BookingData {
  clientName: string
  clientEmail: string
  clientPhone: string
  serviceName: string
  servicePrice: number
  appointmentDate: string
  appointmentTime: string
  staffName: string
  duration: number
}

export async function bookAppointment(data: BookingData) {
  try {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to book appointment')
    }

    return await response.json()
  } catch (error) {
    console.error('[v0] Booking error:', error)
    throw error
  }
}

export async function getAppointments(date?: string, clientEmail?: string) {
  try {
    const params = new URLSearchParams()
    if (date) params.append('date', date)
    if (clientEmail) params.append('clientEmail', clientEmail)

    const response = await fetch(`/api/appointments?${params}`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch appointments')
    }

    return await response.json()
  } catch (error) {
    console.error('[v0] Fetch appointments error:', error)
    throw error
  }
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled'
) {
  try {
    const response = await fetch(`/api/appointments/${appointmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      throw new Error('Failed to update appointment')
    }

    return await response.json()
  } catch (error) {
    console.error('[v0] Update appointment error:', error)
    throw error
  }
}

export async function deleteAppointment(appointmentId: string) {
  try {
    const response = await fetch(`/api/appointments/${appointmentId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete appointment')
    }

    return await response.json()
  } catch (error) {
    console.error('[v0] Delete appointment error:', error)
    throw error
  }
}

export async function triggerAppointmentComplete(data: {
  appointmentId: string
  clientName: string
  clientEmail: string
  serviceName: string
  staffName: string
  servicePrice: number
  completedAt: string
}) {
  try {
    const response = await fetch('/api/webhooks/appointment-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to trigger completion webhook')
    }

    return await response.json()
  } catch (error) {
    console.error('[v0] Completion webhook error:', error)
    throw error
  }
}

export async function triggerAppointmentReminder(data: {
  appointmentId: string
  clientEmail: string
  clientPhone: string
  clientName: string
  appointmentDate: string
  appointmentTime: string
  serviceName: string
}) {
  try {
    const response = await fetch('/api/webhooks/send-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to trigger reminder webhook')
    }

    return await response.json()
  } catch (error) {
    console.error('[v0] Reminder webhook error:', error)
    throw error
  }
}

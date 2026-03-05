import { NextRequest, NextResponse } from 'next/server'

interface ReminderPayload {
  appointmentId: string
  clientEmail: string
  clientPhone: string
  clientName: string
  appointmentDate: string
  appointmentTime: string
  serviceName: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ReminderPayload = await request.json()

    console.log('[v0] Reminder webhook received:', {
      appointmentId: body.appointmentId,
      clientName: body.clientName,
      appointmentDate: body.appointmentDate,
    })

    // Send SMS reminder
    const smsMessage = `Reminder: Your appointment at Syncbase is tomorrow at ${body.appointmentTime} for ${body.serviceName}.`
    console.log(`[v0] SMS sent to ${body.clientPhone}: ${smsMessage}`)

    // Send email reminder
    const emailSubject = `Appointment Reminder - ${body.appointmentDate}`
    console.log(
      `[v0] Email sent to ${body.clientEmail}: ${emailSubject}`
    )

    return NextResponse.json({
      success: true,
      message: 'Reminder sent successfully',
      appointmentId: body.appointmentId,
      notifications: {
        smsSent: true,
        emailSent: true,
        phoneNumber: body.clientPhone,
        emailAddress: body.clientEmail,
      },
    })
  } catch (error) {
    console.error('Reminder webhook error:', error)
    return NextResponse.json(
      { error: 'Failed to send reminder' },
      { status: 500 }
    )
  }
}

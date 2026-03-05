import { NextRequest, NextResponse } from 'next/server'

interface AppointmentCompletePayload {
  appointmentId: string
  clientName: string
  clientEmail: string
  serviceName: string
  staffName: string
  servicePrice: number
  completedAt: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AppointmentCompletePayload = await request.json()

    // This triggers email/SMS notifications
    console.log('[v0] Appointment complete webhook received:', {
      appointmentId: body.appointmentId,
      clientName: body.clientName,
      completedAt: body.completedAt,
    })

    // Simulate sending email notification
    const emailSent = true

    // Simulate sending SMS notification
    const smsSent = true

    // Update loyalty points (mock)
    const loyaltyPointsAdded = Math.floor(body.servicePrice / 10)

    return NextResponse.json({
      success: true,
      message: 'Appointment completion processed',
      appointmentId: body.appointmentId,
      notifications: {
        emailSent,
        smsSent,
        emailAddress: body.clientEmail,
      },
      loyalty: {
        pointsAdded: loyaltyPointsAdded,
        totalSpent: body.servicePrice,
      },
      confirmationMessage: `Thank you for your visit! ${loyaltyPointsAdded} loyalty points added.`,
    })
  } catch (error) {
    console.error('Appointment complete webhook error:', error)
    return NextResponse.json(
      { error: 'Failed to process appointment completion' },
      { status: 500 }
    )
  }
}

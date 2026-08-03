/**
 * Cal.com booking confirmation emails (ticket #17).
 * Ports source `cal-booking-email` — BOOKING_CREATED / BOOKING_RESCHEDULED
 * send one Resend message per attendee.
 */
import { z } from 'zod'
import { sendCalBookingEmail } from '../email'

const calAttendeeSchema = z
  .object({
    email: z.string().email(),
    name: z.string().optional().nullable(),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    timeZone: z.string().optional().nullable(),
  })
  .passthrough()

export const calBookingWebhookSchema = z.object({
  triggerEvent: z.string().min(1),
  createdAt: z.string().optional(),
  payload: z
    .object({
      uid: z.string().min(1),
      startTime: z.string().min(1),
      endTime: z.string().min(1),
      title: z.string().optional().nullable(),
      timeZone: z.string().optional().nullable(),
      attendees: z.array(calAttendeeSchema).min(1),
    })
    .passthrough(),
})

export type CalBookingWebhookInput = z.infer<typeof calBookingWebhookSchema>

export type CalBookingProcessResult =
  | { status: 'success'; sent: number }
  | { status: 'ignored'; triggerEvent: string }

export async function processCalBookingWebhook(
  raw: unknown,
): Promise<CalBookingProcessResult> {
  const parsed = calBookingWebhookSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error('Invalid Cal booking payload')
  }

  const payload = parsed.data
  if (
    payload.triggerEvent !== 'BOOKING_CREATED' &&
    payload.triggerEvent !== 'BOOKING_RESCHEDULED'
  ) {
    return { status: 'ignored', triggerEvent: payload.triggerEvent }
  }

  const booking = payload.payload
  let sent = 0

  for (const attendee of booking.attendees) {
    await sendCalBookingEmail({
      to: attendee.email,
      attendee: {
        email: attendee.email,
        name: attendee.name,
        firstName: attendee.firstName,
        timeZone: attendee.timeZone,
      },
      bookingTitle: booking.title,
      startTime: booking.startTime,
      bookingTimeZone: booking.timeZone,
      triggerEvent: payload.triggerEvent,
      bookingUid: booking.uid,
    })
    sent += 1
  }

  return { status: 'success', sent }
}

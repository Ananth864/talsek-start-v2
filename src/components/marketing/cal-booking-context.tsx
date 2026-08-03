import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { CalBookingDialog } from '#/components/marketing/cal-booking-dialog'

type CalBookingContextValue = {
  openBooking: () => void
}

const CalBookingContext = createContext<CalBookingContextValue | null>(null)

export function CalBookingProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <CalBookingContext.Provider value={{ openBooking: () => setOpen(true) }}>
      {children}
      <CalBookingDialog open={open} onOpenChange={setOpen} />
    </CalBookingContext.Provider>
  )
}

/** Opens the shared Cal.com demo-booking dialog from any marketing CTA. */
export function useCalBooking() {
  const ctx = useContext(CalBookingContext)
  if (!ctx) {
    throw new Error('useCalBooking must be used within CalBookingProvider')
  }
  return ctx
}

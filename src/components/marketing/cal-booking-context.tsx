import { createContext, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CalBookingDialog } from '#/components/marketing/cal-booking-dialog'

type CalBookingContextValue = {
  openBooking: () => void
}

const CalBookingContext = createContext<CalBookingContextValue | null>(null)

export function CalBookingProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const openerRef = useRef<HTMLElement | null>(null)

  function openBooking() {
    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    setOpen(true)
  }

  return (
    <CalBookingContext.Provider value={{ openBooking }}>
      {children}
      <CalBookingDialog
        open={open}
        onOpenChange={setOpen}
        onCloseAutoFocus={(event) => {
          // The shared dialog has several callers rather than one DialogTrigger.
          if (openerRef.current?.isConnected) {
            event.preventDefault()
            openerRef.current.focus()
          }
        }}
      />
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

import { lazy, Suspense } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'

const Cal = lazy(() => import('@calcom/embed-react'))

const CAL_LINK = 'romit-shrivastava/talsek-demo'

type CalBookingDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Shared Cal.com demo-booking dialog for marketing CTAs.
 * Embed mounts only while open so SSR stays clean.
 */
export function CalBookingDialog({ open, onOpenChange }: CalBookingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] w-full max-w-4xl gap-0 overflow-hidden p-0"
        data-testid="cal-booking-dialog"
      >
        <DialogHeader className="border-b border-border p-6 text-left">
          <DialogTitle>Book a Call</DialogTitle>
          <DialogDescription>
            Schedule a demo to see how Talsek can transform your hiring process
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[calc(90vh-8rem)] overflow-auto p-4">
          {open ? (
            <Suspense
              fallback={
                <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">
                  Loading calendar…
                </div>
              }
            >
              <Cal
                calLink={CAL_LINK}
                style={{ width: '100%', minHeight: '600px', height: '100%' }}
                config={{ layout: 'month_view', theme: 'light' }}
              />
            </Suspense>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

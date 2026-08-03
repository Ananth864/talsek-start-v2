/**
 * Blocking dialog when a paid action needs more credits than the Company has
 * (source `InsufficientCreditsModal`). CTA routes to Billing.
 */
import { AlertTriangle, Wallet } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'

type InsufficientCreditsModalProps = {
  isOpen: boolean
  onClose: () => void
  currentBalance: number
  requiredCredits: number
  actionDescription?: string
}

export function InsufficientCreditsModal({
  isOpen,
  onClose,
  currentBalance,
  requiredCredits,
  actionDescription = 'this action',
}: InsufficientCreditsModalProps) {
  const navigate = useNavigate()
  const creditsNeeded = Math.max(0, requiredCredits - currentBalance)

  const handleAddCredits = () => {
    onClose()
    void navigate({ to: '/billing' })
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        data-testid="insufficient-credits-modal"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle>Insufficient Credits</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            You don&apos;t have enough credits for {actionDescription}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Current Balance</p>
                <p className="text-xs text-muted-foreground">Available credits</p>
              </div>
            </div>
            <span
              className="text-xl font-bold"
              data-testid="insufficient-credits-balance"
            >
              {currentBalance.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Required
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                For {actionDescription}
              </p>
            </div>
            <span
              className="text-xl font-bold text-amber-800 dark:text-amber-200"
              data-testid="insufficient-credits-required"
            >
              {requiredCredits.toLocaleString()}
            </span>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            You need{' '}
            <span className="font-semibold text-foreground">
              {creditsNeeded.toLocaleString()}
            </span>{' '}
            more credits
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
            data-testid="insufficient-credits-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddCredits}
            className="w-full sm:w-auto"
            data-testid="insufficient-credits-add"
          >
            Add Credits
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

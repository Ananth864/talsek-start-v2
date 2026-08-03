import { useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { createCheckout, createTopup } from '#/server/fn/billing'
import { PLAN_CODES } from '#/lib/billing-shared'
import { useActiveSubscriptions, useInvalidateBilling } from '#/hooks/use-billing'
import { cn } from '#/lib/utils'

type BuyCreditsButtonProps = {
  companyId: string
  amountCents: number
  label?: string
  className?: string
  disabled?: boolean
  onMessage?: (kind: 'success' | 'error', message: string) => void
}

export function BuyCreditsButton({
  companyId,
  amountCents,
  label = 'Buy Credits',
  className,
  disabled = false,
  onMessage,
}: BuyCreditsButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const { hasMandateEstablished, refetch } = useActiveSubscriptions(companyId)
  const invalidate = useInvalidateBilling(companyId)

  const handleButtonClick = () => {
    if (!amountCents || amountCents <= 0) {
      onMessage?.('error', 'Please enter a valid amount')
      return
    }
    if (hasMandateEstablished) {
      setShowConfirmation(true)
    } else {
      void handleBuy()
    }
  }

  const handleBuy = async () => {
    if (!amountCents || amountCents <= 0) {
      onMessage?.('error', 'Please enter a valid amount')
      return
    }

    setLoading(true)
    setShowConfirmation(false)

    try {
      if (hasMandateEstablished) {
        await createTopup({ data: { amountCents } })
        onMessage?.(
          'success',
          'Top-up initiated! Credits will be added shortly.',
        )
        setTimeout(() => invalidate(), 2000)
      } else {
        const result = await createCheckout({
          data: {
            planCode: PLAN_CODES.WALLET_ANCHOR,
            amountCents,
            returnUrl: `${window.location.origin}/billing`,
          },
        })
        if (result.checkoutUrl) {
          window.location.href = result.checkoutUrl
          return
        }
        throw new Error('No checkout URL returned')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      onMessage?.('error', message)
    } finally {
      setLoading(false)
      void refetch()
    }
  }

  const formattedAmount = amountCents
    ? `$${(amountCents / 100).toFixed(2)}`
    : '$0.00'
  const isDisabled = disabled || loading || !amountCents || amountCents <= 0

  return (
    <>
      <Button
        onClick={handleButtonClick}
        disabled={isDisabled}
        className={className}
        data-testid="buy-credits-button"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {loading ? 'Processing...' : label}
      </Button>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-[#4366B0]" />
              Confirm Credit Purchase
            </DialogTitle>
            <DialogDescription>
              You are about to add{' '}
              <span className="font-semibold text-foreground">
                {formattedAmount}
              </span>{' '}
              to your account. Since you have a payment mandate set up, this
              transaction will be charged automatically to your saved payment
              method.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => setShowConfirmation(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleBuy()}
              disabled={loading}
              className={cn('bg-[#4366B0] hover:bg-[#36528D]')}
              data-testid="confirm-topup-button"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Confirm ${formattedAmount} Purchase`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

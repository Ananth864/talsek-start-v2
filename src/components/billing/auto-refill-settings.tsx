import { useEffect, useState } from 'react'
import { AlertCircle, Loader2, RefreshCw, Save, Zap } from 'lucide-react'
import {
  useActiveSubscriptions,
  useBillingSettings,
  useUpdateBillingSettings,
} from '#/hooks/use-billing'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'
import { cn } from '#/lib/utils'

const QUICK_AMOUNTS = [1, 5, 10, 25, 50, 100]

type AutoRefillSettingsProps = {
  companyId: string
  onMessage?: (kind: 'success' | 'error', message: string) => void
}

export function AutoRefillSettings({
  companyId,
  onMessage,
}: AutoRefillSettingsProps) {
  const { settings, isLoading: settingsLoading } = useBillingSettings(companyId)
  const { hasMandateEstablished, isLoading: subsLoading } =
    useActiveSubscriptions(companyId)
  const updateSettings = useUpdateBillingSettings(companyId)

  const [autoRefillEnabled, setAutoRefillEnabled] = useState(false)
  const [thresholdCredits, setThresholdCredits] = useState('100')
  const [refillAmount, setRefillAmount] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!settings) return
    setAutoRefillEnabled(settings.auto_refill_enabled)
    setThresholdCredits(String(settings.auto_refill_threshold_credits))
    setRefillAmount(
      Math.floor(settings.auto_refill_amount_cents / 100).toString(),
    )
  }, [settings])

  const amountCents = refillAmount
    ? Math.round(parseFloat(refillAmount) * 100)
    : 0
  const creditsGranted = amountCents
  const isValidAmount = Boolean(refillAmount && parseFloat(refillAmount) >= 1)

  const hasChanges = (() => {
    if (!settings) {
      return (
        autoRefillEnabled ||
        thresholdCredits !== '100' ||
        Boolean(refillAmount)
      )
    }
    return (
      autoRefillEnabled !== settings.auto_refill_enabled ||
      thresholdCredits !== String(settings.auto_refill_threshold_credits) ||
      amountCents !== settings.auto_refill_amount_cents
    )
  })()

  const isLoading = settingsLoading || subsLoading
  const isSaving = updateSettings.isPending

  const handleSave = async () => {
    if (autoRefillEnabled && !isValidAmount) return
    try {
      await updateSettings.mutateAsync({
        auto_refill_enabled: autoRefillEnabled,
        auto_refill_threshold_credits: parseInt(thresholdCredits, 10) || 100,
        auto_refill_amount_cents: amountCents || 1000,
      })
      setConfirmOpen(false)
      onMessage?.('success', 'Auto-refill settings saved')
    } catch (err) {
      onMessage?.(
        'error',
        err instanceof Error ? err.message : 'Failed to save settings',
      )
    }
  }

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg" data-testid="auto-refill-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!hasMandateEstablished) {
    return (
      <Card className="border-0 shadow-lg" data-testid="auto-refill-card">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Auto-Refill</CardTitle>
              <CardDescription>
                Automatically top up your credits when balance is low
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            Auto-refill requires an active payment method. Add credits first to
            establish a payment mandate.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden shadow-lg" data-testid="auto-refill-card">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#4366B0]/10 p-2.5 text-[#4366B0]">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Auto-Refill</CardTitle>
            <CardDescription>
              Automatically top up your credits when balance is low
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-4">
          <div className="space-y-0.5">
            <Label
              htmlFor="auto-refill-toggle"
              className="cursor-pointer text-base font-medium"
            >
              Enable Auto-Refill
            </Label>
            <p className="text-sm text-muted-foreground">
              Never run out of credits unexpectedly
            </p>
          </div>
          <Switch
            id="auto-refill-toggle"
            checked={autoRefillEnabled}
            onCheckedChange={setAutoRefillEnabled}
            disabled={isSaving}
            data-testid="auto-refill-toggle"
          />
        </div>

        {autoRefillEnabled ? (
          <div className="space-y-4 rounded-xl border border-[#4366B0]/20 bg-muted/30 p-4">
            <div className="space-y-2">
              <Label htmlFor="threshold-credits">
                Refill when balance drops below
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="threshold-credits"
                  type="number"
                  min={50}
                  max={10000}
                  step={50}
                  value={thresholdCredits}
                  onChange={(e) => setThresholdCredits(e.target.value)}
                  className="w-32"
                  disabled={isSaving}
                  data-testid="auto-refill-threshold"
                />
                <span className="text-sm text-muted-foreground">credits</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refill-amount">Refill amount (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">
                  $
                </span>
                <Input
                  id="refill-amount"
                  type="text"
                  inputMode="numeric"
                  placeholder="10"
                  value={refillAmount}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || /^\d*$/.test(value)) {
                      setRefillAmount(value)
                    }
                  }}
                  disabled={isSaving}
                  className="h-11 pl-7 text-lg font-medium"
                  data-testid="auto-refill-amount"
                />
              </div>
              <p className="text-xs text-muted-foreground">Minimum: $1</p>
            </div>

            <div className="space-y-2">
              <Label>Quick amounts</Label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {QUICK_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRefillAmount(amount.toString())}
                    disabled={isSaving}
                    className={cn(
                      'font-medium',
                      refillAmount === amount.toString() &&
                        'border-[#4366B0] bg-[#4366B0] text-white hover:bg-[#36528D]',
                    )}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>

            {isValidAmount ? (
              <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/80 p-4">
                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-[#4366B0]" />
                <p className="text-sm">
                  When balance drops below{' '}
                  <span className="font-semibold">
                    {parseInt(thresholdCredits, 10) || 100} credits
                  </span>
                  , we charge{' '}
                  <span className="font-semibold">${refillAmount}</span> and add{' '}
                  <span className="font-semibold">
                    {creditsGranted.toLocaleString()} credits
                  </span>
                  . Checks run every 6 hours.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {hasChanges ? (
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={isSaving || (autoRefillEnabled && !isValidAmount)}
            className="h-11 w-full bg-[#4366B0] font-semibold text-white hover:bg-[#36528D]"
            data-testid="auto-refill-save"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        ) : null}

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Auto-Refill Settings</DialogTitle>
              <DialogDescription>
                You are about to {autoRefillEnabled ? 'enable' : 'disable'}{' '}
                automatic credit refills.
                {autoRefillEnabled
                  ? ` When balance drops below ${parseInt(thresholdCredits, 10) || 100} credits, your saved payment method will be charged $${isValidAmount ? refillAmount : '1'}.`
                  : ''}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="bg-[#4366B0] hover:bg-[#36528D]"
                data-testid="auto-refill-confirm"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Confirm Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

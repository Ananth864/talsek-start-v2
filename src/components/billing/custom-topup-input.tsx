import { useState } from 'react'
import { Coins, Plus, Sparkles } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { BuyCreditsButton } from '#/components/billing/buy-credits-button'
import { cn } from '#/lib/utils'

const QUICK_AMOUNTS = [1, 5, 10, 25, 50, 100]

type CustomTopupInputProps = {
  companyId: string
  onMessage?: (kind: 'success' | 'error', message: string) => void
}

export function CustomTopupInput({
  companyId,
  onMessage,
}: CustomTopupInputProps) {
  const [amount, setAmount] = useState('')

  const amountCents = amount ? Math.round(parseFloat(amount) * 100) : 0
  const creditsGranted = amountCents
  const isValidAmount = Boolean(amount && parseInt(amount, 10) >= 1)

  return (
    <Card className="overflow-hidden shadow-lg bg-card" data-testid="add-credits-card">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#4366B0]/10 text-[#4366B0]">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Add Credits</CardTitle>
            <CardDescription>
              Enter the amount you want to add to your wallet
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="topup-amount">Amount (USD)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
              $
            </span>
            <Input
              id="topup-amount"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={amount}
              onChange={(e) => {
                const value = e.target.value
                if (value === '' || /^\d*$/.test(value)) setAmount(value)
              }}
              className="pl-7 text-lg h-12 font-medium"
              data-testid="topup-amount-input"
            />
          </div>
          <p className="text-xs text-muted-foreground">Minimum: $1</p>
        </div>

        {amount && parseInt(amount, 10) > 0 ? (
          <div className="rounded-xl bg-muted/30 p-4 border border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-[#4366B0]" />
                <span className="text-sm text-muted-foreground">
                  You&apos;ll receive
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#4366B0]" />
                <span className="font-bold text-lg">
                  {creditsGranted.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">credits</span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>Quick amounts</Label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {QUICK_AMOUNTS.map((dollarAmount) => (
              <Button
                key={dollarAmount}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(String(dollarAmount))}
                className={cn(
                  'font-medium',
                  amount === String(dollarAmount)
                    ? 'bg-[#4366B0] text-white border-[#4366B0] hover:bg-[#36528D]'
                    : 'hover:border-[#4366B0]/50',
                )}
              >
                ${dollarAmount}
              </Button>
            ))}
          </div>
        </div>

        <BuyCreditsButton
          companyId={companyId}
          amountCents={amountCents}
          label="Add Credits"
          disabled={!isValidAmount}
          onMessage={onMessage}
          className={cn(
            'w-full h-11 font-semibold text-base',
            isValidAmount
              ? 'bg-[#4366B0] hover:bg-[#36528D] text-white shadow-lg'
              : '',
          )}
        />
      </CardContent>
    </Card>
  )
}

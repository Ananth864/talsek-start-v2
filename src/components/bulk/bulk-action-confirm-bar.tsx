import { CheckSquare, Square, X } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import type { BulkActionMode } from '#/hooks/use-bulk-action-mode'

type BulkActionConfirmBarProps = {
  mode: BulkActionMode
  selectedCount: number
  isAllSelected: boolean
  onCancel: () => void
  onToggleSelectAll: () => void
  onConfirm: () => void
  confirmDisabled?: boolean
  className?: string
}

/**
 * Confirm bar while selecting candidates for bulk Shortlist or bulk reject.
 * Layout: [X Cancel] [☐ Select All] [Shortlist|Reject] — source parity.
 */
export function BulkActionConfirmBar({
  mode,
  selectedCount,
  isAllSelected,
  onCancel,
  onToggleSelectAll,
  onConfirm,
  confirmDisabled,
  className,
}: BulkActionConfirmBarProps) {
  const isShortlist = mode === 'selecting-shortlist'
  const actionLabel = isShortlist ? 'Shortlist' : 'Reject'
  const confirmVariant = isShortlist ? 'default' : 'destructive'

  return (
    <div
      className={cn('flex items-center', className)}
      data-testid="bulk-action-confirm-bar"
      data-bulk-mode={mode}
    >
      <span className="mr-3 text-sm font-medium text-muted-foreground">
        {selectedCount} selected
      </span>

      <div className="flex items-center overflow-hidden rounded-lg border border-border bg-background/50 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-10 rounded-none border-r border-border px-3 hover:bg-destructive/10 hover:text-destructive"
          aria-label="Cancel bulk action"
          data-testid="bulk-action-cancel"
        >
          <X className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSelectAll}
          className="h-10 rounded-none border-r border-border px-3 hover:bg-accent"
          aria-label={isAllSelected ? 'Deselect all' : 'Select all'}
          data-testid="bulk-action-select-all"
        >
          {isAllSelected ? (
            <CheckSquare className="h-4 w-4 text-primary" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant={confirmVariant}
          size="sm"
          onClick={onConfirm}
          disabled={selectedCount === 0 || confirmDisabled}
          className="h-10 rounded-none px-4 font-semibold"
          data-testid="bulk-action-confirm"
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  )
}

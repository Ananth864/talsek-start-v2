import { CheckSquare, Square, X } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

type BulkActionConfirmBarProps = {
  selectedCount: number
  isAllSelected: boolean
  onCancel: () => void
  onToggleSelectAll: () => void
  onConfirm: () => void
  confirmDisabled?: boolean
  className?: string
}

/**
 * Confirm bar while selecting candidates for bulk shortlist.
 * Layout: [X Cancel] [☐ Select All] [Shortlist] — source parity, stage-only.
 */
export function BulkActionConfirmBar({
  selectedCount,
  isAllSelected,
  onCancel,
  onToggleSelectAll,
  onConfirm,
  confirmDisabled,
  className,
}: BulkActionConfirmBarProps) {
  return (
    <div
      className={cn('flex items-center', className)}
      data-testid="bulk-action-confirm-bar"
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
          variant="default"
          size="sm"
          onClick={onConfirm}
          disabled={selectedCount === 0 || confirmDisabled}
          className="h-10 rounded-none px-4 font-semibold"
          data-testid="bulk-action-confirm"
        >
          Shortlist
        </Button>
      </div>
    </div>
  )
}

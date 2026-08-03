import { AlertTriangle, Loader } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'

type BulkRejectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidateCount: number
  onConfirm: () => void
  isLoading: boolean
}

/**
 * Confirm dialog for bulk reject (source `BulkRejectModal`).
 */
export function BulkRejectDialog({
  open,
  onOpenChange,
  candidateCount,
  onConfirm,
  isLoading,
}: BulkRejectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        data-testid="bulk-reject-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            Reject {candidateCount} Candidate
            {candidateCount === 1 ? '' : 's'}
          </DialogTitle>
          <DialogDescription>
            This action will mark the selected candidates as rejected. They will
            be moved out of the active pipeline.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader className="size-4 animate-spin" />
            Rejecting candidates…
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            data-testid="bulk-reject-confirm"
          >
            {isLoading ? (
              <>
                <Loader className="mr-2 size-4 animate-spin" />
                Rejecting…
              </>
            ) : (
              `Reject ${candidateCount} Candidate${candidateCount === 1 ? '' : 's'}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

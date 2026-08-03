import { CheckCircle, ChevronDown, Users, XCircle } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'

type BulkActionDropdownProps = {
  onSelectShortlist: () => void
  onSelectReject: () => void
  disableShortlist?: boolean
  disableReject?: boolean
  /** Preserved for behavioural E2E (`data-can-send-reachout`). */
  canSendReachout?: boolean
}

/**
 * Board chrome to enter bulk Shortlist / Reject selection (source
 * `BulkActionDropdown`). Menu item testids match the former enter buttons so
 * behavioural specs keep working.
 */
export function BulkActionDropdown({
  onSelectShortlist,
  onSelectReject,
  disableShortlist = false,
  disableReject = false,
  canSendReachout = true,
}: BulkActionDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-10 shrink-0 gap-2"
          data-testid="bulk-action-menu"
        >
          <Users className="size-4 md:hidden" />
          <span className="hidden font-semibold md:inline">Bulk Action</span>
          <ChevronDown className="size-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuItem
          disabled={disableShortlist}
          onSelect={() => {
            if (!disableShortlist) onSelectShortlist()
          }}
          className="flex cursor-pointer gap-4 p-3"
          data-testid="bulk-shortlist-enter"
          data-can-send-reachout={canSendReachout ? 'true' : 'false'}
        >
          <CheckCircle className="size-5 shrink-0 text-emerald-500" />
          <div>
            <div className="text-sm font-semibold">Select to Shortlist</div>
            <p className="text-sm leading-snug text-muted-foreground">
              {disableShortlist
                ? 'Not available on last stage'
                : 'Move selected candidates to the next stage'}
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={disableReject}
          onSelect={() => {
            if (!disableReject) onSelectReject()
          }}
          className="flex cursor-pointer gap-4 p-3"
          data-testid="bulk-reject-enter"
        >
          <XCircle className="size-5 shrink-0 text-destructive" />
          <div>
            <div className="text-sm font-semibold">Select to Reject</div>
            <p className="text-sm leading-snug text-muted-foreground">
              {disableReject
                ? 'Not available on last stage'
                : 'Mark selected candidates as rejected'}
            </p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

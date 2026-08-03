import { cn } from '#/lib/utils'
import type { JobStageRow } from '#/server/fn/job-applications'

type StageTabsProps = {
  stages: JobStageRow[]
  counts: Map<string, number>
  activeStageId: string | undefined
  onSelect: (stageId: string) => void
  /** When true, tabs stay visible but do not change selection (bulk mode). */
  disabled?: boolean
  className?: string
}

/** Formats a stage's candidate count, capping the badge at 999+. */
function countLabel(n: number): string {
  return n > 999 ? '999+' : String(n)
}

/**
 * The pipeline stage tabs (source: `StageTabs`). Renders the Job's stages in
 * `stage_order` as a segmented pill rail, each labelled with its **Hiring Stage**
 * name and the count of candidates currently in that stage. Selection is driven
 * by the parent via the `?stageId=` search param; the count comes from grouping
 * the applications by `current_stage_id`.
 */
export function StageTabs({
  stages,
  counts,
  activeStageId,
  onSelect,
  disabled = false,
  className,
}: StageTabsProps) {
  if (stages.length === 0) return null

  return (
    <div
      data-testid="stage-tabs"
      role="tablist"
      aria-label="Hiring stages"
      className={cn('relative w-full min-w-0', className)}
    >
      <div className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border-2 border-border/40 bg-background/50 p-1.5">
        {stages.map((stage) => {
          const isActive = stage.id === activeStageId
          const count = counts.get(stage.id) ?? 0
          return (
            <button
              key={stage.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-disabled={disabled}
              data-testid="stage-tab"
              onClick={() => {
                if (!disabled) onSelect(stage.id)
              }}
              className={cn(
                'relative z-10 flex shrink-0 select-none items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium outline-none transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'
                  : 'text-muted-foreground hover:text-foreground',
                disabled &&
                  'cursor-not-allowed opacity-50 hover:text-muted-foreground',
              )}
            >
              <span>{stage.hiring_stage.name}</span>
              <span
                className={cn(
                  'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {countLabel(count)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

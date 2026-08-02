import { cn } from '#/lib/utils'
import type { JobStageRow } from '#/server/fn/job-applications'

type StageTabsProps = {
  stages: JobStageRow[]
  counts: Map<string, number>
  activeStageId: string | undefined
  onSelect: (stageId: string) => void
}

/** Formats a stage's candidate count, capping the badge at 999+. */
function countLabel(n: number): string {
  return n > 999 ? '999+' : String(n)
}

/**
 * The pipeline stage tabs (source: `StageTabs`). Renders the Job's stages in
 * `stage_order` as selectable pills, each labelled with its **Hiring Stage**
 * name and the count of candidates currently in that stage. Selection is driven
 * by the parent via the `?stageId=` search param; the count comes from grouping
 * the applications by `current_stage_id`.
 */
export function StageTabs({
  stages,
  counts,
  activeStageId,
  onSelect,
}: StageTabsProps) {
  if (stages.length === 0) return null

  return (
    <div
      data-testid="stage-tabs"
      role="tablist"
      aria-label="Hiring stages"
      className="flex items-center gap-1.5 overflow-x-auto border-b p-2"
    >
      {stages.map((stage) => {
        const isActive = stage.id === activeStageId
        const count = counts.get(stage.id) ?? 0
        return (
          <button
            key={stage.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-testid="stage-tab"
            onClick={() => onSelect(stage.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              isActive
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <span className="whitespace-nowrap">{stage.hiring_stage.name}</span>
            <span
              className={cn(
                'flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums',
                isActive
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {countLabel(count)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

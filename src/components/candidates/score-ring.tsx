import { cn } from '#/lib/utils'
import { scoreBand } from '#/lib/job-applications-shared'

/**
 * Circular match-score ring for a candidate card. A focused read-path port of
 * the source's `ScoreRing`: renders the normalized `final_score` (0–100) as a
 * progress ring labelled with the percentage, coloured by score band. The
 * source recomputes the displayed value client-side via `computeDynamicScore`;
 * the read path uses the persisted `final_score` (the column the board is
 * ordered by) — see ADR-0011.
 */
export function ScoreRing({
  score,
  size: sizeVariant = 'list',
  className,
}: {
  score: number
  /** Grid cards use a larger ring (source `ScoreRing` size="grid"). */
  size?: 'list' | 'grid'
  className?: string
}) {
  const safe = Math.min(100, Math.max(0, Math.round(score)))
  const size = sizeVariant === 'grid' ? 56 : 44
  const stroke = sizeVariant === 'grid' ? 5 : 4
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (safe / 100) * circumference

  return (
    <div
      className={cn('relative flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      aria-label={`Match score ${safe}%`}
      role="img"
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={scoreBand(safe).stroke}
        />
      </svg>
      <span
        className={cn(
          'absolute font-semibold tabular-nums',
          sizeVariant === 'grid' ? 'text-xs' : 'text-[11px]',
        )}
      >
        {safe}
      </span>
    </div>
  )
}

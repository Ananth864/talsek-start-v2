import { cn } from '#/lib/utils'
import { scoreBand } from '#/lib/job-applications-shared'

/**
 * Circular match-score ring for a candidate card. Sized to match source
 * `ScoreRing` (`md` list = 64px / text-xl; `grid` = 70px / text-xl).
 */
export function ScoreRing({
  score,
  size: sizeVariant = 'list',
  className,
}: {
  score: number
  /** Grid cards use the source `ScoreRing` size="grid". */
  size?: 'list' | 'grid'
  className?: string
}) {
  const safe = Math.min(100, Math.max(0, Math.round(score)))
  // Source: md → dimension 16 → 64px, radius 34, stroke 6, viewBox 80
  //         grid → dimension 17.5 → 70px, radius 38, stroke 7, viewBox 88
  const pixel = sizeVariant === 'grid' ? 70 : 64
  const radius = sizeVariant === 'grid' ? 38 : 34
  const stroke = sizeVariant === 'grid' ? 7 : 6
  const viewBox = sizeVariant === 'grid' ? 88 : 80
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - safe / 100)

  return (
    <div
      className={cn('relative flex shrink-0 items-center justify-center', className)}
      style={{ width: pixel, height: pixel }}
      aria-label={`Match score ${safe}%`}
      role="img"
    >
      <svg
        width={pixel}
        height={pixel}
        viewBox={`0 0 ${viewBox} ${viewBox}`}
        className="-rotate-90 transform"
      >
        <circle
          cx={viewBox / 2}
          cy={viewBox / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="text-muted-foreground opacity-30"
          stroke="currentColor"
        />
        <circle
          cx={viewBox / 2}
          cy={viewBox / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={scoreBand(safe).stroke}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />      </svg>
      <span className="absolute text-xl font-bold text-foreground tabular-nums">
        {safe}%
      </span>
    </div>
  )
}

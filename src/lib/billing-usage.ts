/**
 * Pure helpers for billing Usage-tab aggregates (source useUsageStats parity).
 */

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

export type DailyUsage = {
  date: string
  credits: number
}

export type CategoryUsage = {
  name: string
  value: number
  /** CSS color token (e.g. var(--chart-1)) for Recharts fills. */
  color: string
}

export type JobUsage = {
  id: string
  name: string
  resumes: number
  interviews: number
  totalCredits: number
}

export type UsageStats = {
  dailyUsage: DailyUsage[]
  categoryData: CategoryUsage[]
  jobUsageData: JobUsage[]
  totalCreditsUsed: number
}

export function formatUsageDayLabel(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  return `${MONTH_LABELS[date.getMonth()]} ${day}`
}

/** Last 14 calendar days inclusive of today (source: subDays(today, 13)…today). */
export function eachOfLast14Days(now = new Date()): Date[] {
  const days: Date[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    days.push(d)
  }
  return days
}

export function buildDailyUsage(
  transactions: Array<{ amount: number; created_at: string }>,
  now = new Date(),
): DailyUsage[] {
  const dailyMap = new Map<string, number>()
  for (const tx of transactions) {
    const dateKey = formatUsageDayLabel(new Date(tx.created_at))
    const credits = Math.abs(tx.amount)
    dailyMap.set(dateKey, (dailyMap.get(dateKey) ?? 0) + credits)
  }

  return eachOfLast14Days(now).map((day) => {
    const dateKey = formatUsageDayLabel(day)
    return {
      date: dateKey,
      credits: dailyMap.get(dateKey) ?? 0,
    }
  })
}

export function buildCategoryUsage(
  resumeCredits: number,
  interviewCredits: number,
): CategoryUsage[] {
  return [
    {
      name: 'Resume Screening',
      value: resumeCredits,
      color: 'var(--chart-1)',
    },
    {
      name: 'Screening Interview',
      value: interviewCredits,
      color: 'var(--chart-2)',
    },
  ]
}

export function buildJobUsageRows(
  jobs: Array<{ id: string; title: string }>,
  resumeByJob: Map<string, { credits: number; count: number }>,
  interviewByJob: Map<string, { credits: number; count: number }>,
): JobUsage[] {
  return jobs
    .map((job) => {
      const resumeData = resumeByJob.get(job.id) ?? { credits: 0, count: 0 }
      const interviewData = interviewByJob.get(job.id) ?? {
        credits: 0,
        count: 0,
      }
      return {
        id: job.id,
        name: job.title,
        resumes: resumeData.count,
        interviews: interviewData.count,
        totalCredits: resumeData.credits + interviewData.credits,
      }
    })
    .filter((job) => job.totalCredits > 0)
    .sort((a, b) => b.totalCredits - a.totalCredits)
    .slice(0, 10)
}

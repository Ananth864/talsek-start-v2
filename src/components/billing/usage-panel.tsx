import {
  Activity,
  Briefcase,
  FileText,
  Loader2,
  TrendingUp,
  Video,
  Wallet,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { UsageStats } from '#/lib/billing-usage'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'

type UsagePanelProps = {
  balance: number
  usage: UsageStats
  isLoading: boolean
  error: Error | null
}

function chartTooltipStyle() {
  return {
    borderRadius: '12px',
    border: '1px solid var(--border)',
    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)',
    background: 'var(--background)',
    color: 'var(--foreground)',
    padding: '12px 16px',
  }
}

export function UsagePanel({
  balance,
  usage,
  isLoading,
  error,
}: UsagePanelProps) {
  const { dailyUsage, categoryData, jobUsageData, totalCreditsUsed } = usage

  if (error) {
    return (
      <Card data-testid="usage-panel">
        <CardContent className="py-8">
          <p className="text-sm text-destructive">{error.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6" data-testid="usage-panel">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                {isLoading ? (
                  <Loader2 className="mt-2 h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <p
                      className="text-2xl font-bold"
                      data-testid="usage-wallet-balance"
                    >
                      {balance.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      ≈ ${(balance / 100).toFixed(2)} USD
                    </p>
                  </>
                )}
              </div>
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Credits Used (all time)
                </p>
                {isLoading ? (
                  <Loader2 className="mt-2 h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <p
                      className="text-2xl font-bold"
                      data-testid="usage-total-credits"
                    >
                      {totalCreditsUsed.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      ≈ ${(totalCreditsUsed / 100).toFixed(2)} USD spent
                    </p>
                  </>
                )}
              </div>
              <div className="rounded-xl bg-muted p-3 text-muted-foreground">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
                {isLoading ? (
                  <Loader2 className="mt-2 h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <p
                      className="text-2xl font-bold"
                      data-testid="usage-active-jobs"
                    >
                      {jobUsageData.length}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      with credit activity
                    </p>
                  </>
                )}
              </div>
              <div className="rounded-xl bg-muted p-3 text-muted-foreground">
                <Briefcase className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-0 shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-4 w-4 text-primary" />
              Daily Credit Usage
            </CardTitle>
            <CardDescription>
              Credit consumption over the last 14 days (credits per day)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[320px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div
                className="h-[320px] w-full"
                data-testid="usage-daily-chart"
                role="img"
                aria-label="Bar chart of daily credit usage over the last 14 days"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dailyUsage}
                    margin={{ top: 8, right: 8, left: 12, bottom: 24 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      label={{
                        value: 'Date',
                        position: 'insideBottom',
                        offset: -2,
                        style: {
                          fill: 'var(--muted-foreground)',
                          fontSize: 11,
                        },
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      width={48}
                      label={{
                        value: 'Credits',
                        angle: -90,
                        position: 'insideLeft',
                        style: {
                          fill: 'var(--muted-foreground)',
                          fontSize: 11,
                        },
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: 'color-mix(in srgb, var(--muted) 40%, transparent)' }}
                      contentStyle={chartTooltipStyle()}
                      formatter={(value) => [
                        typeof value === 'number'
                          ? value.toLocaleString()
                          : String(value ?? 0),
                        'Credits consumed',
                      ]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend
                      verticalAlign="top"
                      height={28}
                      formatter={() => 'Credits consumed'}
                    />
                    <Bar
                      dataKey="credits"
                      name="Credits consumed"
                      fill="var(--chart-1)"
                      radius={[6, 6, 0, 0]}
                      barSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Usage by Service</CardTitle>
            <CardDescription>
              Credits by service type (Resume Screening vs Screening Interview)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[280px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div
                  className="relative h-[200px] w-full"
                  data-testid="usage-service-chart"
                  role="img"
                  aria-label="Pie chart of credit usage by service"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                        strokeWidth={0}
                      >
                        {categoryData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={chartTooltipStyle()}
                        formatter={(value, name) => [
                          typeof value === 'number'
                            ? `${value.toLocaleString()} credits`
                            : String(value ?? 0),
                          String(name),
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <span className="block text-xl font-bold">
                        {totalCreditsUsed.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Total credits
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  className="mt-4 flex justify-center gap-6"
                  data-testid="usage-service-legend"
                  aria-label="Service usage legend"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ background: 'var(--chart-1)' }}
                    />
                    <span className="text-xs text-muted-foreground">
                      Resume Screening
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ background: 'var(--chart-2)' }}
                    />
                    <span className="text-xs text-muted-foreground">
                      Screening Interview
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Credits Used per Job</CardTitle>
          <CardDescription>
            Credit consumption by Job (top 10 active Jobs with usage)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto" data-testid="usage-job-table">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Job Title
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Resumes
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Interviews
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Total Credits
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {jobUsageData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="rounded-full bg-muted/50 p-3">
                            <Briefcase className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            No usage data yet
                          </p>
                          <p className="text-xs text-muted-foreground/70">
                            Credit consumption will appear here as you screen
                            resumes and conduct Interviews.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    jobUsageData.map((job) => (
                      <tr
                        key={job.id}
                        className="border-b last:border-0 hover:bg-muted/30"
                        data-testid={`usage-job-row-${job.id}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                              <Briefcase className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">{job.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            <span
                              className="text-sm font-medium"
                              data-testid={`usage-job-resumes-${job.id}`}
                            >
                              {job.resumes}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1">
                            <Video className="h-3.5 w-3.5 text-muted-foreground" />
                            <span
                              className="text-sm font-medium"
                              data-testid={`usage-job-interviews-${job.id}`}
                            >
                              {job.interviews}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className="text-sm font-bold"
                            data-testid={`usage-job-credits-${job.id}`}
                          >
                            {job.totalCredits.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

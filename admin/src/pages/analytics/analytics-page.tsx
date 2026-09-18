import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { getAnalytics } from '@/api/ops'
import { useAsyncData } from '@/hooks/use-async-data'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { ErrorState, LoadingBlock, PageHeader } from '@/components/ui/page'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatNumber } from '@/lib/utils'
import type { DashboardKpiMetric } from '@/types/admin'

const growthConfig = {
  users: { label: 'Users', color: 'var(--chart-1)' },
  recipes: { label: 'Recipes', color: 'var(--chart-4)' },
} satisfies ChartConfig

function kpiTone(metric?: DashboardKpiMetric) {
  if (!metric) return 'outline' as const
  if (metric.availability === 'future_reserved') return 'secondary' as const
  if (metric.availability === 'available') return 'success' as const
  if (metric.availability === 'estimated') return 'warning' as const
  return 'outline' as const
}

function KpiCard({ metric }: { metric?: DashboardKpiMetric }) {
  if (!metric) return null
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{metric.label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">
          {metric.value == null ? '—' : formatNumber(metric.value)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-xs text-muted-foreground">
        <Badge variant={kpiTone(metric)}>{metric.availability}</Badge>
        <div>Source: {metric.source ?? '—'}</div>
        <div>Freshness: {metric.freshness ?? '—'}</div>
        {metric.note ? <p>{metric.note}</p> : null}
      </CardContent>
    </Card>
  )
}

export function AnalyticsPage() {
  const { data, loading, error, reload } = useAsyncData(() => getAnalytics(), [])

  if (loading) return <LoadingBlock label="Loading analytics…" />
  if (error || !data) {
    return (
      <ErrorState
        title="Analytics unavailable"
        description={error ?? 'No analytics payload returned.'}
        onRetry={reload}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Downloads, growth, and import quality from live aggregation. Google Play stays Future Reserved — missing Apple values stay empty, never 0."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard metric={data.downloads.ios} />
        <KpiCard metric={data.downloads.android} />
        <KpiCard metric={data.revenue.apple} />
        <KpiCard metric={data.revenue.android} />
      </div>
      <p className="mb-6 text-sm text-muted-foreground">{data.revenue.note}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User growth</CardTitle>
            <CardDescription>{data.userGrowth.source}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={growthConfig} className="h-56 w-full">
              <AreaChart data={data.userGrowth.series}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area dataKey="users" type="monotone" fill="var(--color-users)" stroke="var(--color-users)" />
                <Area dataKey="recipes" type="monotone" fill="var(--color-recipes)" stroke="var(--color-recipes)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import quality</CardTitle>
            <CardDescription>{data.importQuality.source}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Imported</div>
                <div className="text-lg font-semibold tabular-nums">{data.importQuality.imported}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Needs review</div>
                <div className="text-lg font-semibold tabular-nums">{data.importQuality.needsReview}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Failed</div>
                <div className="text-lg font-semibold tabular-nums">{data.importQuality.failed}</div>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Imported</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.importQuality.bySourceType.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No import jobs yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.importQuality.bySourceType.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell>{row.key}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.total}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.imported}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.failed}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { Library, Heart, CookingPot, Users } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { getDashboard } from '@/api'
import { useAsyncData } from '@/hooks/use-async-data'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { ErrorState, LoadingBlock, PageHeader } from '@/components/ui/page'
import { formatDate, formatNumber } from '@/lib/utils'

const chartConfig = {
  users: { label: 'Users', color: 'var(--chart-1)' },
  recipes: { label: 'Recipes', color: 'var(--chart-4)' },
} satisfies ChartConfig

export function DashboardPage() {
  const { data, loading, error, reload } = useAsyncData(() => getDashboard(), [])

  if (loading) return <LoadingBlock label="Loading dashboard…" />
  if (error || !data) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        description={error ?? 'No dashboard payload returned.'}
        onRetry={reload}
      />
    )
  }

  const cards = [
    { label: 'Total Users', value: data.stats.totalUsers, icon: Users },
    { label: 'Total Recipes', value: data.stats.totalRecipes, icon: CookingPot },
    { label: 'Collections', value: data.stats.collections, icon: Library },
    { label: 'Favorites', value: data.stats.favorites, icon: Heart },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Operational overview from Admin API (mock until live endpoints are wired)."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription>{card.label}</CardDescription>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold tabular-nums tracking-tight">
                  {formatNumber(card.value)}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Monthly registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full aspect-auto">
              <AreaChart data={data.growth}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="var(--color-users)"
                  fill="var(--color-users)"
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recipe Growth</CardTitle>
            <CardDescription>Monthly recipe creations</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full aspect-auto">
              <AreaChart data={data.growth}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="recipes"
                  stroke="var(--color-recipes)"
                  fill="var(--color-recipes)"
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Recent Data</CardTitle>
          <CardDescription>Latest admin-visible activity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            data.recent.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{item.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{item.subtitle}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary">{item.type}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

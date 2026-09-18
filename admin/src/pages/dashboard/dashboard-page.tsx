import {
  CreditCard,
  Download,
  Heart,
  Library,
  CookingPot,
  Smartphone,
  Users,
  UserPlus,
} from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from 'recharts'
import { getDashboard, isMockMode } from '@/api'
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
import { formatDate, formatMoney, formatNumber } from '@/lib/utils'

const growthConfig = {
  users: { label: 'Users', color: 'var(--chart-1)' },
  recipes: { label: 'Recipes', color: 'var(--chart-4)' },
} satisfies ChartConfig

const revenueConfig = {
  revenueApple: { label: 'Apple', color: 'var(--chart-1)' },
  revenueAndroid: { label: 'Android', color: 'var(--chart-2)' },
} satisfies ChartConfig

const downloadConfig = {
  downloadsIos: { label: 'iOS', color: 'var(--chart-1)' },
  downloadsAndroid: { label: 'Android', color: 'var(--chart-2)' },
} satisfies ChartConfig

function storeLabel(store: string) {
  if (store === 'app_store') return 'Apple'
  if (store === 'play_store') return 'Android'
  return store
}

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

  const userCards = [
    { label: 'Total users', value: formatNumber(data.stats.totalUsers), icon: Users },
    { label: 'New this month', value: formatNumber(data.stats.newUsersThisMonth), icon: UserPlus },
    {
      label: 'Active paid',
      value: formatNumber(data.stats.activePaidUsers),
      icon: CreditCard,
    },
    {
      label: 'Suspended',
      value: formatNumber(data.stats.suspendedUsers),
      icon: Users,
    },
  ]

  const paymentCards = [
    {
      label: 'Total revenue',
      value: formatMoney(data.stats.revenueTotal),
      hint: 'RevenueCat purchase_events (CookApp DB)',
    },
    {
      label: 'MRR (est.)',
      value: formatMoney(data.stats.revenueMrr),
      hint: 'Provisional estimate — not Financial Reports',
    },
    {
      label: 'Apple revenue',
      value: formatMoney(data.stats.revenueApple),
      hint: 'App Store events in DB',
    },
    {
      label: 'Android revenue',
      value: isMockMode() ? formatMoney(data.stats.revenueAndroid) : 'Future Reserved',
      hint: isMockMode()
        ? 'Play Store'
        : 'Google Play not connected — do not treat as live KPI (P1)',
    },
  ]

  const downloadCards = [
    {
      label: 'Total downloads',
      value: isMockMode()
        ? formatNumber(data.stats.downloadsTotal)
        : formatNumber(data.stats.downloadsIos),
      icon: Download,
      hint: isMockMode() ? undefined : 'iOS only until ASC Analytics sync (P1 #47)',
    },
    {
      label: 'iOS downloads',
      value: formatNumber(data.stats.downloadsIos),
      icon: Smartphone,
      hint: 'app_download_stats (manual/seed until ASC)',
    },
    {
      label: 'Android downloads',
      value: isMockMode() ? formatNumber(data.stats.downloadsAndroid) : 'Future Reserved',
      icon: Smartphone,
      hint: isMockMode() ? undefined : 'Google Play not connected',
    },
    {
      label: 'Payment txns',
      value: formatNumber(data.stats.paymentTransactions),
      icon: CreditCard,
      hint: 'CookApp purchase_events count',
    },
  ]

  const contentCards = [
    { label: 'Recipes', value: data.stats.totalRecipes, icon: CookingPot },
    { label: 'Collections', value: data.stats.collections, icon: Library },
    { label: 'Favorites', value: data.stats.favorites, icon: Heart },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={
          isMockMode()
            ? 'Mock detailed users, payments, and downloads overview.'
            : 'Live: CookApp DB aggregates via GET /functions/v1/admin-dashboard. Full store analytics wait for P1 (#47).'
        }
      />

      {!isMockMode() ? (
        <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm">
          <p className="font-medium text-amber-900 dark:text-amber-200">
            Provisional dashboard — not Production-certified analytics
          </p>
          <p className="mt-1 text-muted-foreground">
            User/recipe/collection counts and RevenueCat-backed payment events come from CookApp DB.
            App Store Connect Analytics sync and Google Play remain Future Reserved. Do not treat
            Android zeros or download seeds as store truth (Issue #52 / Notion V2 §15).
          </p>
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">Users</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {userCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription>{card.label}</CardDescription>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold tabular-nums tracking-tight">
                    {card.value}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">Payments</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {paymentCards.map((card) => (
            <Card key={card.label}>
              <CardHeader className="pb-2">
                <CardDescription>{card.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tabular-nums tracking-tight">
                  {card.value}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">Downloads & content</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {downloadCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription>{card.label}</CardDescription>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold tabular-nums tracking-tight">
                    {card.value}
                  </div>
                  {card.hint ? (
                    <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {contentCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription>{card.label}</CardDescription>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold tabular-nums tracking-tight">
                    {formatNumber(card.value)}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by platform</CardTitle>
            <CardDescription>Apple vs Android paid amounts</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueConfig} className="h-64 w-full aspect-auto">
              <BarChart data={data.series} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="revenueApple" name="Apple" fill="var(--color-revenueApple)" radius={4} />
                <Bar
                  dataKey="revenueAndroid"
                  name="Android"
                  fill="var(--color-revenueAndroid)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Downloads trend</CardTitle>
            <CardDescription>iOS vs Android installs by month</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={downloadConfig} className="h-64 w-full aspect-auto">
              <AreaChart data={data.series} margin={{ left: 8, right: 12, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="downloadsIos"
                  name="iOS"
                  stroke="var(--color-downloadsIos)"
                  fill="var(--color-downloadsIos)"
                  fillOpacity={0.18}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="downloadsAndroid"
                  name="Android"
                  stroke="var(--color-downloadsAndroid)"
                  fill="var(--color-downloadsAndroid)"
                  fillOpacity={0.18}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User & recipe growth</CardTitle>
            <CardDescription>Monthly registrations and recipe creations</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={growthConfig} className="h-64 w-full aspect-auto">
              <AreaChart data={data.series} margin={{ left: 8, right: 12, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="users"
                  name="Users"
                  stroke="var(--color-users)"
                  fill="var(--color-users)"
                  fillOpacity={0.18}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="recipes"
                  name="Recipes"
                  stroke="var(--color-recipes)"
                  fill="var(--color-recipes)"
                  fillOpacity={0.18}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User mix</CardTitle>
            <CardDescription>Registration type · device · plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">Registration</div>
              <div className="flex flex-wrap gap-1.5">
                {data.userBreakdown.byRegistrationType.map((item) => (
                  <Badge key={item.key} variant="secondary">
                    {item.label} {item.value}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">Device</div>
              <div className="flex flex-wrap gap-1.5">
                {data.userBreakdown.byDeviceType.map((item) => (
                  <Badge key={item.key} variant="outline">
                    {item.label} {item.value}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">Plan</div>
              <div className="flex flex-wrap gap-1.5">
                {data.userBreakdown.byPlan.map((item) => (
                  <Badge key={item.key} variant="secondary">
                    {item.label} {item.value}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent payments</CardTitle>
            <CardDescription>Latest paid / subscription store events</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payment events yet.</p>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentPayments.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="font-medium text-sm">{row.userLabel}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {storeLabel(row.store)}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{row.eventType}</TableCell>
                        <TableCell className="tabular-nums text-xs">
                          {row.amount == null
                            ? '—'
                            : formatMoney(row.amount, row.currency ?? 'USD')}
                        </TableCell>
                        <TableCell className="text-xs">{formatDate(row.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Users, payments, downloads, and content</CardDescription>
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
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

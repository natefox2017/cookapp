import { useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from 'recharts'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  getSubscriptionRevenue,
  listSubscriptionPlans,
  listSubscriptions,
  updateSubscriptionPlan,
} from '@/api'
import { useAsyncData } from '@/hooks/use-async-data'
import type {
  BillingPeriod,
  StorePlatform,
  SubscriptionPlanInput,
  SubscriptionPlanProduct,
  SubscriptionStatus,
} from '@/types/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState, ErrorState, LoadingBlock, PageHeader } from '@/components/ui/page'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate, formatMoney, formatNumber } from '@/lib/utils'

const emptyPlan: SubscriptionPlanInput = {
  planKey: 'pro_monthly',
  displayName: '',
  platform: 'app_store',
  productId: '',
  price: 0,
  currency: 'USD',
  billingPeriod: 'monthly',
  active: true,
  description: null,
}

const revenueChartConfig = {
  apple: { label: 'Apple', color: 'var(--chart-1)' },
  android: { label: 'Android', color: 'var(--chart-2)' },
  total: { label: 'Total', color: 'var(--chart-3)' },
} satisfies ChartConfig

function statusVariant(status: SubscriptionStatus) {
  if (status === 'active') return 'success' as const
  if (status === 'trialing') return 'warning' as const
  if (status === 'cancelled' || status === 'billing_issue') return 'secondary' as const
  return 'destructive' as const
}

function platformLabel(platform: StorePlatform | null) {
  if (platform === 'app_store') return 'Apple'
  if (platform === 'play_store') return 'Android'
  return '—'
}

function PlansPanel() {
  const { data, loading, error, reload } = useAsyncData(() => listSubscriptionPlans(), [])
  const [platformFilter, setPlatformFilter] = useState<StorePlatform | 'all'>('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<SubscriptionPlanProduct | null>(null)
  const [form, setForm] = useState<SubscriptionPlanInput>(emptyPlan)
  const [saving, setSaving] = useState(false)

  const rows = useMemo(() => {
    if (!data) return []
    if (platformFilter === 'all') return data
    return data.filter((item) => item.platform === platformFilter)
  }, [data, platformFilter])

  function openCreate() {
    setEditing(null)
    setForm(emptyPlan)
    setOpen(true)
  }

  function openEdit(item: SubscriptionPlanProduct) {
    setEditing(item)
    setForm({
      planKey: item.planKey,
      displayName: item.displayName,
      platform: item.platform,
      productId: item.productId,
      price: item.price,
      currency: item.currency,
      billingPeriod: item.billingPeriod,
      active: item.active,
      description: item.description,
    })
    setOpen(true)
  }

  async function onSave() {
    const payload: SubscriptionPlanInput = {
      ...form,
      planKey: form.planKey.trim(),
      displayName: form.displayName.trim(),
      productId: form.productId.trim(),
      currency: form.currency.trim().toUpperCase() || 'USD',
      description: form.description?.trim() || null,
      price: Number(form.price),
    }
    if (!payload.planKey || !payload.displayName || !payload.productId) {
      window.alert('Plan key, display name, and product ID are required.')
      return
    }
    if (!Number.isFinite(payload.price) || payload.price < 0) {
      window.alert('Price must be a non-negative number.')
      return
    }
    setSaving(true)
    try {
      if (editing) await updateSubscriptionPlan(editing.id, payload)
      else await createSubscriptionPlan(payload)
      setOpen(false)
      reload()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(item: SubscriptionPlanProduct) {
    if (!window.confirm(`Delete plan “${item.displayName}” (${platformLabel(item.platform)})?`)) {
      return
    }
    try {
      await deleteSubscriptionPlan(item.id)
      reload()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">Platform</Label>
          <Select
            value={platformFilter}
            onValueChange={(value) => setPlatformFilter(value as StorePlatform | 'all')}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="app_store">Apple</SelectItem>
              <SelectItem value="play_store">Android</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add plan
        </Button>
      </div>

      {loading ? <LoadingBlock label="Loading plans…" /> : null}
      {error ? (
        <ErrorState title="Could not load plans" description={error} onRetry={reload} />
      ) : null}
      {!loading && !error && rows.length === 0 ? (
        <EmptyState
          title="No subscription plans"
          description="Add Apple and Android product SKUs that map to RevenueCat offerings."
        />
      ) : null}

      {rows.length > 0 ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Product ID</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.displayName}</div>
                    <div className="text-xs text-muted-foreground font-mono">{item.planKey}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{platformLabel(item.platform)}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{item.productId}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatMoney(item.price, item.currency)}
                  </TableCell>
                  <TableCell>{item.billingPeriod}</TableCell>
                  <TableCell>
                    <Badge variant={item.active ? 'success' : 'secondary'}>
                      {item.active ? 'active' : 'paused'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Edit plan"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Delete plan"
                        onClick={() => void onDelete(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit plan' : 'Add plan'}</DialogTitle>
            <DialogDescription>
              Configure store-specific product ID and list price. Keep Apple and Android as separate
              rows.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="planKey">Plan key</Label>
              <Input
                id="planKey"
                value={form.planKey}
                onChange={(event) => setForm((prev) => ({ ...prev, planKey: event.target.value }))}
                placeholder="pro_monthly"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, displayName: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Platform</Label>
              <Select
                value={form.platform}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, platform: value as StorePlatform }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="app_store">Apple (App Store)</SelectItem>
                  <SelectItem value="play_store">Android (Play Store)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="productId">Store product ID</Label>
              <Input
                id="productId"
                className="font-mono text-sm"
                value={form.productId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, productId: event.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, price: Number(event.target.value) }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={form.currency}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, currency: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Billing period</Label>
              <Select
                value={form.billingPeriod}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, billingPeriod: value as BillingPeriod }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description ?? ''}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div>
                <div className="text-sm font-medium">Active</div>
                <div className="text-xs text-muted-foreground">Paused plans stay in catalog</div>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, active: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void onSave()}>
              {editing ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RecordsPanel({ platform }: { platform: StorePlatform | 'all' }) {
  const { data, loading, error, reload } = useAsyncData(
    () => listSubscriptions({ platform }),
    [platform],
  )

  return (
    <div className="space-y-4">
      {loading ? <LoadingBlock label="Loading subscription records…" /> : null}
      {error ? (
        <ErrorState title="Could not load records" description={error} onRetry={reload} />
      ) : null}
      {!loading && !error && data?.length === 0 ? (
        <EmptyState
          title="No subscriptions"
          description="Records appear when RevenueCat webhooks sync entitlements for this platform."
        />
      ) : null}

      {data && data.length > 0 ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>Expiration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.user.displayName}</div>
                    <div className="text-xs text-muted-foreground">{item.user.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{platformLabel(item.platform)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <Badge variant="secondary" className="w-fit">
                        {item.plan}
                      </Badge>
                      {item.productId ? (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {item.productId}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {item.amount == null
                      ? '—'
                      : formatMoney(item.amount, item.currency ?? 'USD')}
                  </TableCell>
                  <TableCell>{formatDate(item.startDate)}</TableCell>
                  <TableCell>
                    {item.expirationDate ? formatDate(item.expirationDate) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  )
}

function RevenuePanel({ platform }: { platform: StorePlatform | 'all' }) {
  const { data, loading, error, reload } = useAsyncData(
    () => getSubscriptionRevenue(platform),
    [platform],
  )

  if (loading) return <LoadingBlock label="Loading revenue…" />
  if (error || !data) {
    return (
      <ErrorState
        title="Revenue unavailable"
        description={error ?? 'No revenue payload returned.'}
        onRetry={reload}
      />
    )
  }

  const cards = [
    { label: 'MRR (est.)', value: formatMoney(data.stats.mrr) },
    { label: 'Apple revenue', value: formatMoney(data.stats.appleRevenue) },
    { label: 'Android revenue', value: formatMoney(data.stats.androidRevenue) },
    { label: 'Active paid', value: formatNumber(data.stats.activePaid) },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardDescription>{card.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums tracking-tight">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly revenue</CardTitle>
            <CardDescription>Apple vs Android amounts</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueChartConfig} className="h-64 w-full aspect-auto">
              <BarChart data={data.series}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                {(platform === 'all' || platform === 'app_store') && (
                  <Bar dataKey="apple" fill="var(--color-apple)" radius={4} />
                )}
                {(platform === 'all' || platform === 'play_store') && (
                  <Bar dataKey="android" fill="var(--color-android)" radius={4} />
                )}
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total revenue trend</CardTitle>
            <CardDescription>Combined store proceeds by month</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueChartConfig} className="h-64 w-full aspect-auto">
              <AreaChart data={data.series}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-total)"
                  fill="var(--color-total)"
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function SubscriptionPage() {
  const [platform, setPlatform] = useState<StorePlatform | 'all'>('all')

  return (
    <div>
      <PageHeader
        title="Subscription"
        description="Manage Apple / Android plan catalog, review entitlements, and track revenue."
        actions={
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground hidden sm:inline">Platform</Label>
            <Select
              value={platform}
              onValueChange={(value) => setPlatform(value as StorePlatform | 'all')}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All platforms</SelectItem>
                <SelectItem value="app_store">Apple</SelectItem>
                <SelectItem value="play_store">Android</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <PlansPanel />
        </TabsContent>
        <TabsContent value="records">
          <RecordsPanel platform={platform} />
        </TabsContent>
        <TabsContent value="revenue">
          <RevenuePanel platform={platform} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

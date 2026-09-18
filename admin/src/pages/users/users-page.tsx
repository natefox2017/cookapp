import { useMemo, useState } from 'react'
import { Apple, MonitorSmartphone, Smartphone, TabletSmartphone } from 'lucide-react'
import { getUser, getUserRegistrationStats, listUsers } from '@/api'
import { useAsyncData } from '@/hooks/use-async-data'
import type {
  AdminUser,
  AdminUserDetail,
  DeviceType,
  RegistrationProvider,
  SubscriptionPlan,
  UserStatus,
} from '@/types/admin'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EmptyState, ErrorState, LoadingBlock, PageHeader } from '@/components/ui/page'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate, formatMoney, formatNumber } from '@/lib/utils'

function statusVariant(status: UserStatus) {
  if (status === 'active') return 'success' as const
  if (status === 'suspended') return 'warning' as const
  return 'destructive' as const
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function providerLabel(provider: RegistrationProvider) {
  if (provider === 'apple') return 'Apple'
  if (provider === 'google') return 'Google'
  if (provider === 'email') return 'Email'
  return 'Unknown'
}

function deviceLabel(device: DeviceType) {
  if (device === 'ios') return 'iOS'
  if (device === 'android') return 'Android'
  if (device === 'web') return 'Web'
  return 'Unknown'
}

function storeLabel(store: 'app_store' | 'play_store' | null) {
  if (store === 'app_store') return 'Apple'
  if (store === 'play_store') return 'Google Play'
  return '—'
}

export function UsersPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<UserStatus | 'all'>('all')
  const [subscription, setSubscription] = useState<SubscriptionPlan | 'all'>('all')
  const [registrationProvider, setRegistrationProvider] = useState<
    RegistrationProvider | 'all'
  >('all')
  const [deviceType, setDeviceType] = useState<DeviceType | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const query = useMemo(
    () => ({ q, status, subscription, registrationProvider, deviceType }),
    [q, status, subscription, registrationProvider, deviceType],
  )

  const stats = useAsyncData(() => getUserRegistrationStats(), [])
  const list = useAsyncData(() => listUsers(query), [query])
  const detail = useAsyncData<AdminUserDetail | null>(
    () => (selectedId ? getUser(selectedId) : Promise.resolve(null)),
    [selectedId],
  )

  return (
    <div>
      <PageHeader
        title="Users"
        description="Search accounts, registration mix, and per-user payment history."
      />

      {stats.loading ? <LoadingBlock label="Loading registration stats…" /> : null}
      {stats.error ? (
        <ErrorState
          title="Could not load registration stats"
          description={stats.error}
          onRetry={stats.reload}
        />
      ) : null}

      {stats.data ? (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Registration type</CardDescription>
              <div className="text-sm text-muted-foreground">
                {formatNumber(stats.data.total)} total users
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.data.byProvider.map((bucket) => (
                  <div
                    key={bucket.key}
                    className="rounded-lg border bg-muted/30 px-3 py-2"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {bucket.key === 'apple' ? (
                        <Apple className="h-3.5 w-3.5" aria-hidden />
                      ) : null}
                      {bucket.label}
                    </div>
                    <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                      {formatNumber(bucket.count)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Device mix</CardDescription>
              <div className="text-sm text-muted-foreground">
                Captured at registration / first session
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.data.byDevice.map((bucket) => (
                  <div
                    key={bucket.key}
                    className="rounded-lg border bg-muted/30 px-3 py-2"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {bucket.key === 'ios' || bucket.key === 'android' ? (
                        <Smartphone className="h-3.5 w-3.5" aria-hidden />
                      ) : bucket.key === 'web' ? (
                        <MonitorSmartphone className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        <TabletSmartphone className="h-3.5 w-3.5" aria-hidden />
                      )}
                      {bucket.label}
                    </div>
                    <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                      {formatNumber(bucket.count)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap">
        <Input
          placeholder="Search email or name…"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          className="lg:max-w-xs"
        />
        <Select value={status} onValueChange={(value) => setStatus(value as UserStatus | 'all')}>
          <SelectTrigger className="lg:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={subscription}
          onValueChange={(value) => setSubscription(value as SubscriptionPlan | 'all')}
        >
          <SelectTrigger className="lg:w-40">
            <SelectValue placeholder="Subscription" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="lifetime">Lifetime</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={registrationProvider}
          onValueChange={(value) =>
            setRegistrationProvider(value as RegistrationProvider | 'all')
          }
        >
          <SelectTrigger className="lg:w-40">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All providers</SelectItem>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={deviceType}
          onValueChange={(value) => setDeviceType(value as DeviceType | 'all')}
        >
          <SelectTrigger className="lg:w-40">
            <SelectValue placeholder="Device" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All devices</SelectItem>
            <SelectItem value="ios">iOS</SelectItem>
            <SelectItem value="android">Android</SelectItem>
            <SelectItem value="web">Web</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {list.loading ? <LoadingBlock label="Loading users…" /> : null}
      {list.error ? (
        <ErrorState title="Could not load users" description={list.error} onRetry={list.reload} />
      ) : null}
      {!list.loading && !list.error && list.data?.data.length === 0 ? (
        <EmptyState
          title="No users match"
          description="Adjust search or filters to see results."
        />
      ) : null}

      {list.data && list.data.data.length > 0 ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Recipes</TableHead>
                <TableHead>Favorites</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.data.data.map((user: AdminUser) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{initials(user.displayName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.displayName}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{providerLabel(user.registrationProvider)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{deviceLabel(user.deviceType)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.subscription}</Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{user.recipeCount}</TableCell>
                  <TableCell className="tabular-nums">{user.favoriteCount}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(user.status)}>{user.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => setSelectedId(user.id)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <Sheet open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>User detail</SheetTitle>
            <SheetDescription>Registration meta and payment timeline</SheetDescription>
          </SheetHeader>
          {detail.loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
          {detail.error ? (
            <ErrorState title="Could not load user" description={detail.error} onRetry={detail.reload} />
          ) : null}
          {detail.data ? (
            <div className="mt-4 space-y-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{initials(detail.data.displayName)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{detail.data.displayName}</div>
                  <div className="text-sm text-muted-foreground">{detail.data.email}</div>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Provider</dt>
                  <dd className="font-medium">
                    {providerLabel(detail.data.registrationProvider)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Device</dt>
                  <dd className="font-medium">{deviceLabel(detail.data.deviceType)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Registration IP</dt>
                  <dd className="font-medium font-mono text-xs sm:text-sm">
                    {detail.data.registrationIp ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Subscription</dt>
                  <dd className="font-medium">{detail.data.subscription}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium">{detail.data.status}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Recipes</dt>
                  <dd className="font-medium tabular-nums">{detail.data.recipeCount}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Favorites</dt>
                  <dd className="font-medium tabular-nums">{detail.data.favoriteCount}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Locale</dt>
                  <dd className="font-medium">{detail.data.locale}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Timezone</dt>
                  <dd className="font-medium">{detail.data.timezone}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="font-medium">{formatDate(detail.data.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Last login</dt>
                  <dd className="font-medium">
                    {detail.data.lastLoginAt ? formatDate(detail.data.lastLoginAt) : '—'}
                  </dd>
                </div>
              </dl>

              <div>
                <h3 className="mb-2 text-sm font-semibold">Payment history</h3>
                {detail.data.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No purchase events recorded.</p>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>When</TableHead>
                          <TableHead>Event</TableHead>
                          <TableHead>Store</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.data.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="whitespace-nowrap text-xs">
                              {formatDate(payment.purchasedAt)}
                            </TableCell>
                            <TableCell>
                              <div className="text-xs font-medium">{payment.eventType}</div>
                              <div className="text-[11px] text-muted-foreground">
                                {payment.productId ?? '—'}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              {storeLabel(payment.store)}
                              {payment.environment ? (
                                <div className="text-[11px] text-muted-foreground">
                                  {payment.environment}
                                </div>
                              ) : null}
                            </TableCell>
                            <TableCell className="text-right text-xs tabular-nums">
                              {payment.amount == null
                                ? '—'
                                : formatMoney(payment.amount, payment.currency ?? 'USD')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <Button variant="outline" onClick={() => setSelectedId(null)}>
                Close
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}

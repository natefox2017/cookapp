import { useMemo, useState } from 'react'
import { getUser, listUsers } from '@/api'
import { useAsyncData } from '@/hooks/use-async-data'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type {
  AdminUser,
  AdminUserDetail,
  DeviceType,
  RegistrationType,
  SubscriptionPlan,
  UserStatus,
} from '@/types/admin'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { formatDate, formatMoney } from '@/lib/utils'

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

function registrationLabel(value: RegistrationType) {
  if (value === 'apple') return 'Apple'
  if (value === 'google') return 'Google'
  if (value === 'email') return 'Email'
  return 'Unknown'
}

function deviceLabel(value: DeviceType) {
  if (value === 'iphone') return 'iPhone'
  if (value === 'ipad') return 'iPad'
  if (value === 'android') return 'Android'
  if (value === 'web') return 'Web'
  return 'Unknown'
}

function storeLabel(store: string | null | undefined) {
  if (store === 'app_store') return 'Apple'
  if (store === 'play_store') return 'Android'
  if (!store) return '—'
  return store
}

export function UsersPage() {
  const [q, setQ] = useState('')
  const debouncedQ = useDebouncedValue(q, 250)
  const [status, setStatus] = useState<UserStatus | 'all'>('all')
  const [subscription, setSubscription] = useState<SubscriptionPlan | 'all'>('all')
  const [registrationType, setRegistrationType] = useState<RegistrationType | 'all'>('all')
  const [deviceType, setDeviceType] = useState<DeviceType | 'all'>('all')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const query = useMemo(
    () => ({
      q: debouncedQ,
      status,
      subscription,
      registrationType,
      deviceType,
      page,
      pageSize,
    }),
    [debouncedQ, status, subscription, registrationType, deviceType, page, pageSize],
  )

  const list = useAsyncData(() => listUsers(query), [query])
  const detail = useAsyncData<AdminUserDetail | null>(
    () => (selectedId ? getUser(selectedId) : Promise.resolve(null)),
    [selectedId],
  )

  const total = list.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const stats = list.data?.stats

  function updateFilter<T>(setter: (value: T) => void, value: T) {
    setter(value)
    setPage(1)
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="Registration meta (IP / provider / device) and per-user payment records."
      />

      {stats ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Matched users</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{stats.total}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              After current filters
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Registration type</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {(['apple', 'google', 'email', 'unknown'] as RegistrationType[]).map((key) => (
                <Badge key={key} variant="secondary">
                  {registrationLabel(key)} {stats.byRegistrationType[key]}
                </Badge>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Device type</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {(['iphone', 'ipad', 'android', 'web', 'unknown'] as DeviceType[]).map((key) => (
                <Badge key={key} variant="outline">
                  {deviceLabel(key)} {stats.byDeviceType[key]}
                </Badge>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Users with payments</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{stats.withPayments}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              At least one paid purchase event
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap">
        <Input
          placeholder="Search email, name, or IP…"
          value={q}
          onChange={(event) => {
            setQ(event.target.value)
            setPage(1)
          }}
          className="sm:max-w-xs"
        />
        <Select
          value={status}
          onValueChange={(value) => updateFilter(setStatus, value as UserStatus | 'all')}
        >
          <SelectTrigger className="sm:w-40">
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
          onValueChange={(value) =>
            updateFilter(setSubscription, value as SubscriptionPlan | 'all')
          }
        >
          <SelectTrigger className="sm:w-40">
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
          value={registrationType}
          onValueChange={(value) =>
            updateFilter(setRegistrationType, value as RegistrationType | 'all')
          }
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Registration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All registration</SelectItem>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={deviceType}
          onValueChange={(value) => updateFilter(setDeviceType, value as DeviceType | 'all')}
        >
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Device" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All devices</SelectItem>
            <SelectItem value="iphone">iPhone</SelectItem>
            <SelectItem value="ipad">iPad</SelectItem>
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
        <>
          <div className="rounded-xl border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Registration</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Subscription</TableHead>
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
                      <Badge variant="secondary">
                        {registrationLabel(user.registrationType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{deviceLabel(user.deviceType)}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {user.registrationIp ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{user.subscription}</Badge>
                    </TableCell>
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
          <div className="mt-3 flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>
              {total} user{total === 1 ? '' : 's'}
              {list.refreshing ? ' · refreshing…' : ''}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Previous
              </Button>
              <span className="tabular-nums">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : null}

      <Sheet open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>User detail</SheetTitle>
            <SheetDescription>Registration meta and payment history</SheetDescription>
          </SheetHeader>
          {detail.loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
          {detail.error ? (
            <ErrorState
              title="Could not load user"
              description={detail.error}
              onRetry={detail.reload}
            />
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

              <div>
                <h3 className="mb-2 text-sm font-semibold">Registration</h3>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Type</dt>
                    <dd className="font-medium">
                      {registrationLabel(detail.data.registrationType)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Device</dt>
                    <dd className="font-medium">{deviceLabel(detail.data.deviceType)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Registration IP</dt>
                    <dd className="font-mono text-sm">{detail.data.registrationIp ?? '—'}</dd>
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
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">Account</h3>
                <dl className="grid grid-cols-2 gap-3 text-sm">
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
                </dl>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">Payment records</h3>
                {detail.data.paymentRecords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No purchase events for this user.</p>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Store</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.data.paymentRecords.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>
                              <div className="font-medium text-xs">{row.eventType}</div>
                              <div className="font-mono text-[11px] text-muted-foreground">
                                {row.productId ?? '—'}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">{storeLabel(row.store)}</TableCell>
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

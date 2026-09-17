import { useMemo, useState } from 'react'
import { getUser, listUsers } from '@/api'
import { useAsyncData } from '@/hooks/use-async-data'
import type { AdminUser, AdminUserDetail, SubscriptionPlan, UserStatus } from '@/types/admin'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState, LoadingBlock, PageHeader } from '@/components/ui/page'
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
import { formatDate } from '@/lib/utils'

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

export function UsersPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<UserStatus | 'all'>('all')
  const [subscription, setSubscription] = useState<SubscriptionPlan | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const query = useMemo(
    () => ({ q, status, subscription }),
    [q, status, subscription],
  )

  const list = useAsyncData(() => listUsers(query), [query])
  const detail = useAsyncData<AdminUserDetail | null>(
    () => (selectedId ? getUser(selectedId) : Promise.resolve(null)),
    [selectedId],
  )

  return (
    <div>
      <PageHeader
        title="Users"
        description="Search and inspect user accounts via GET /admin/users."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search email or name…"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={status} onValueChange={(value) => setStatus(value as UserStatus | 'all')}>
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
          onValueChange={(value) => setSubscription(value as SubscriptionPlan | 'all')}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Subscription" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="lifetime">Lifetime</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {list.loading ? <LoadingBlock label="Loading users…" /> : null}
      {list.error ? (
        <EmptyState title="Could not load users" description={list.error} />
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
        <SheetContent>
          <SheetHeader>
            <SheetTitle>User detail</SheetTitle>
            <SheetDescription>GET /admin/users/:id</SheetDescription>
          </SheetHeader>
          {detail.loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
          {detail.error ? <p className="text-sm text-destructive">{detail.error}</p> : null}
          {detail.data ? (
            <div className="mt-4 space-y-4">
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

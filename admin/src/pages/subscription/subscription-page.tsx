import { listSubscriptions } from '@/api'
import { useAsyncData } from '@/hooks/use-async-data'
import type { SubscriptionStatus } from '@/types/admin'
import { Badge } from '@/components/ui/badge'
import { EmptyState, LoadingBlock, PageHeader } from '@/components/ui/page'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

function statusVariant(status: SubscriptionStatus) {
  if (status === 'active') return 'success' as const
  if (status === 'trialing') return 'warning' as const
  if (status === 'cancelled') return 'secondary' as const
  return 'destructive' as const
}

export function SubscriptionPage() {
  const { data, loading, error } = useAsyncData(() => listSubscriptions(), [])

  return (
    <div>
      <PageHeader
        title="Subscription"
        description="Plan status and entitlement windows for users."
      />

      {loading ? <LoadingBlock label="Loading subscriptions…" /> : null}
      {error ? <EmptyState title="Could not load subscriptions" description={error} /> : null}
      {!loading && !error && data?.length === 0 ? (
        <EmptyState
          title="No subscriptions"
          description="No subscription records were returned."
        />
      ) : null}

      {data && data.length > 0 ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Expiration Date</TableHead>
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
                    <Badge variant="secondary">{item.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
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

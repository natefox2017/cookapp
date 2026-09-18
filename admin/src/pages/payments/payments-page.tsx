import { listPaymentTransactions } from '@/api/ops'
import { useAsyncData } from '@/hooks/use-async-data'
import { Badge } from '@/components/ui/badge'
import { ErrorState, LoadingBlock, PageHeader } from '@/components/ui/page'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate, formatMoney } from '@/lib/utils'

export function PaymentsPage() {
  const { data, loading, error, reload } = useAsyncData(() => listPaymentTransactions(), [])

  if (loading) return <LoadingBlock label="Loading payments…" />
  if (error || !data) {
    return (
      <ErrorState
        title="Payments unavailable"
        description={error ?? 'No payment_transactions payload returned.'}
        onRetry={reload}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Normalized payment_transactions. RevenueCat amounts are estimated, not Apple Financial final proceeds. Google Play is Future Reserved."
      />
      <p className="mb-4 text-sm text-muted-foreground">
        {data.googlePlay.note} ({data.googlePlay.status})
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Store</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Gross</TableHead>
            <TableHead className="text-right">Estimated</TableHead>
            <TableHead className="text-right">Final</TableHead>
            <TableHead>Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-muted-foreground">
                No payment transactions yet.
              </TableCell>
            </TableRow>
          ) : (
            data.data.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {row.purchaseAt ? formatDate(row.purchaseAt) : formatDate(row.createdAt)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{row.eventType}</Badge>
                </TableCell>
                <TableCell>{row.store ?? '—'}</TableCell>
                <TableCell className="font-mono text-xs">{row.productId ?? '—'}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.grossAmount == null ? '—' : formatMoney(row.grossAmount, row.currency ?? 'USD')}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.estimatedProceeds == null
                    ? '—'
                    : formatMoney(row.estimatedProceeds, row.currency ?? 'USD')}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.finalProceeds == null ? '—' : formatMoney(row.finalProceeds, row.currency ?? 'USD')}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{row.providerSource ?? '—'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

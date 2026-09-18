import { listAuditLogs } from '@/api/ops'
import { useAsyncData } from '@/hooks/use-async-data'
import { EmptyState, ErrorState, LoadingBlock, PageHeader } from '@/components/ui/page'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

export function AuditLogPage() {
  const { data, loading, error, reload } = useAsyncData(() => listAuditLogs(), [])

  if (loading) return <LoadingBlock label="Loading audit log…" />
  if (error || !data) {
    return (
      <ErrorState
        title="Audit log unavailable"
        description={error ?? 'No audit payload.'}
        onRetry={reload}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description="Privileged Admin actions. Secret values are never written to the log."
      />

      {data.data.length === 0 ? (
        <EmptyState title="No audit entries" description="Actions will appear here after Admin mutations." />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.actorUsername ?? row.actorAdminId ?? '—'}</TableCell>
                  <TableCell className="font-medium">{row.action}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.objectType}
                    {row.objectId ? ` · ${row.objectId}` : ''}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{row.ip ?? '—'}</TableCell>
                  <TableCell>{row.result}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(row.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

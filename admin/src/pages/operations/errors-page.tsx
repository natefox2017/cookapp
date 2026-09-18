import { listOpsJobs } from '@/api/ops'
import { useAsyncData } from '@/hooks/use-async-data'
import { Badge } from '@/components/ui/badge'
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

/** Aggregate failed / incident jobs — no invented error taxonomy. */
export function ErrorsPage() {
  const { data, loading, error, reload } = useAsyncData(() => listOpsJobs(), [])

  if (loading) return <LoadingBlock label="Loading incidents…" />
  if (error || !data) {
    return (
      <ErrorState
        title="Errors unavailable"
        description={error ?? 'No jobs payload.'}
        onRetry={reload}
      />
    )
  }

  const failed = data.data.filter(
    (job) => job.status === 'failed' || Boolean(job.errorCode) || Boolean(job.errorMessage),
  )

  return (
    <div>
      <PageHeader
        title="Errors & Incidents"
        description="Failed operational jobs and sync errors. Empty means no recent failures — not a fake green status."
      />

      {failed.length === 0 ? (
        <EmptyState
          title="No recent incidents"
          description="No failed jobs in the current ops window. Check Jobs & Syncs for full history."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Count / retries</TableHead>
                <TableHead>Last seen</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {failed.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.jobType}</TableCell>
                  <TableCell>{job.provider}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm">
                    {job.errorCode ?? '—'}
                    {job.errorMessage ? ` · ${job.errorMessage}` : ''}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {job.itemsFailed ?? 0} / {job.retryCount}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(job.completedAt ?? job.startedAt ?? '')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive">{job.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

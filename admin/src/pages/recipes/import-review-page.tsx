import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  approveImportJob,
  listImportJobs,
  rejectImportJob,
  reparseImportJob,
  retryImportJob,
} from '@/api/ops'
import { useAsyncData } from '@/hooks/use-async-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

export function ImportReviewPage() {
  const { data, loading, error, reload, refreshing } = useAsyncData(
    () => listImportJobs('needs_review'),
    [],
  )
  const [busy, setBusy] = useState<string | null>(null)

  async function run(id: string, action: () => Promise<unknown>) {
    setBusy(id)
    try {
      await action()
      reload()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setBusy(null)
    }
  }

  if (loading) return <LoadingBlock label="Loading review queue…" />
  if (error) {
    return (
      <ErrorState title="Import review unavailable" description={error} onRetry={reload} />
    )
  }

  return (
    <div>
      <PageHeader
        title="Import Review"
        description="Only low-confidence, missing-field, duplicate, or failed jobs need a human. Approvals publish into the System Recipe Library."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/content/import">AI Import</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/content/recipes">System Recipe Library</Link>
            </Button>
            <Button variant="outline" loading={refreshing} onClick={reload}>
              Refresh
            </Button>
          </div>
        }
      />

      {!data?.length ? (
        <EmptyState
          title="Review queue empty"
          description="Jobs that import automatically do not appear here."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="max-w-xs truncate font-mono text-xs">
                  {job.sourceUrl ?? job.sourceType}
                </TableCell>
                <TableCell className="tabular-nums">
                  {job.confidence == null ? '—' : job.confidence.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge variant="warning">{job.errorCode ?? job.status}</Badge>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground">{job.errorMessage}</p>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(job.updatedAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      loading={busy === job.id}
                      onClick={() => run(job.id, () => approveImportJob(job.id))}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === job.id}
                      onClick={() => run(job.id, () => reparseImportJob(job.id))}
                    >
                      Reparse
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === job.id}
                      onClick={() => run(job.id, () => retryImportJob(job.id))}
                    >
                      Retry
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busy === job.id}
                      onClick={() => run(job.id, () => rejectImportJob(job.id))}
                    >
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

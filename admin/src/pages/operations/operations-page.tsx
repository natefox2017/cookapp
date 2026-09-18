import { useState } from 'react'
import { listOpsJobs, retryOpsJob, runOpsJob } from '@/api/ops'
import { useAsyncData } from '@/hooks/use-async-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ErrorState, LoadingBlock, PageHeader } from '@/components/ui/page'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

const MANUAL_TYPES = [
  'storage_cleanup_import_artifacts',
  'store_analytics_sync',
  'financial_report_sync',
  'revenuecat_health_check',
  'ai_gateway_health_check',
  'recipe_import_worker',
]

function statusVariant(status: string) {
  if (status === 'succeeded') return 'success' as const
  if (status === 'failed') return 'destructive' as const
  if (status === 'running' || status === 'pending') return 'warning' as const
  if (status === 'future_reserved') return 'secondary' as const
  return 'outline' as const
}

export function OperationsPage() {
  const { data, loading, error, reload, refreshing } = useAsyncData(() => listOpsJobs(), [])
  const [jobType, setJobType] = useState(MANUAL_TYPES[0])
  const [running, setRunning] = useState(false)
  const [retrying, setRetrying] = useState<string | null>(null)

  async function onRun() {
    setRunning(true)
    try {
      await runOpsJob(jobType)
      reload()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Run failed')
    } finally {
      setRunning(false)
    }
  }

  async function onRetry(id: string) {
    setRetrying(id)
    try {
      await retryOpsJob(id)
      reload()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Retry failed')
    } finally {
      setRetrying(null)
    }
  }

  if (loading) return <LoadingBlock label="Loading jobs…" />
  if (error || !data) {
    return (
      <ErrorState
        title="Operations unavailable"
        description={error ?? 'No jobs payload returned.'}
        onRetry={reload}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="Jobs & Syncs"
        description="Unified Jobs & Syncs. Google Play stays Future Reserved. Manual runs use existing Backend workers."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="ops-job-type" className="sr-only">
              Job type
            </Label>
            <Select value={jobType} onValueChange={setJobType} disabled={running}>
              <SelectTrigger id="ops-job-type" className="w-64" aria-label="Job type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MANUAL_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button loading={running} onClick={onRun}>
              Run
            </Button>
            <Button variant="outline" loading={refreshing} onClick={reload}>
              Refresh
            </Button>
          </div>
        }
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Error</TableHead>
            <TableHead className="text-right">Retry</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground">
                No operational jobs yet.
              </TableCell>
            </TableRow>
          ) : (
            data.data.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-mono text-xs">{job.jobType}</TableCell>
                <TableCell>{job.provider}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {job.startedAt ? formatDate(job.startedAt) : '—'}
                </TableCell>
                <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                  {job.errorMessage ?? '—'}
                </TableCell>
                <TableCell className="text-right">
                  {job.status === 'failed' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={retrying === job.id}
                      onClick={() => onRetry(job.id)}
                    >
                      Retry
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

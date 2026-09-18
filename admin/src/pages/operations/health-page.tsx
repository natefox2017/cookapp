import { getSystemHealth } from '@/api/ops'
import { useAsyncData } from '@/hooks/use-async-data'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState, LoadingBlock, PageHeader } from '@/components/ui/page'
import { formatDate } from '@/lib/utils'

function statusVariant(status: string) {
  if (status === 'healthy') return 'success' as const
  if (status === 'degraded') return 'warning' as const
  if (status === 'down') return 'destructive' as const
  return 'secondary' as const
}

function statusLabel(status: string) {
  if (status === 'healthy') return 'Healthy'
  if (status === 'degraded') return 'Degraded'
  if (status === 'down') return 'Down'
  if (status === 'not_configured' || status === 'future_reserved') return 'Not Configured'
  return status
}

export function HealthPage() {
  const { data, loading, error, reload } = useAsyncData(() => getSystemHealth(), [])

  if (loading) return <LoadingBlock label="Loading system health…" />
  if (error || !data) {
    return (
      <ErrorState
        title="System health unavailable"
        description={error ?? 'No health payload.'}
        onRetry={reload}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="System Health"
        description="Live probes for Backend, stores, AI Gateway, and related providers. Not Configured is honest — never decorative Operational."
      />
      <p className="mb-4 text-xs text-muted-foreground">
        Last checked: {formatDate(data.generatedAt)} · source: admin-operations/health
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.components.map((row) => (
          <Card key={row.key}>
            <CardHeader className="pb-2">
              <CardDescription>{row.label}</CardDescription>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Badge variant={statusVariant(row.status)}>{statusLabel(row.status)}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-muted-foreground">
              <div>Last success: {row.lastSuccessAt ? formatDate(row.lastSuccessAt) : '—'}</div>
              <div>Last error: {row.lastErrorAt ? formatDate(row.lastErrorAt) : '—'}</div>
              {row.lastError ? <div className="text-destructive">{row.lastError}</div> : null}
              {row.note ? <div>{row.note}</div> : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

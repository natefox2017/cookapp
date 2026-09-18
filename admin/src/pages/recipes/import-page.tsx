import { useState } from 'react'
import { Link } from 'react-router-dom'
import { enqueueImportJob, listImportJobs } from '@/api/ops'
import { useAsyncData } from '@/hooks/use-async-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { EmptyState, ErrorState, LoadingBlock, PageHeader } from '@/components/ui/page'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

export function ImportPage() {
  const { data, loading, error, reload, refreshing } = useAsyncData(() => listImportJobs(), [])
  const [urls, setUrls] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function onSubmit() {
    const lines = urls
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    if (lines.length === 0) {
      window.alert('Paste at least one URL.')
      return
    }
    setSubmitting(true)
    setMessage(null)
    try {
      let ok = 0
      const errors: string[] = []
      for (const url of lines) {
        try {
          await enqueueImportJob(url)
          ok += 1
        } catch (err) {
          errors.push(`${url}: ${err instanceof Error ? err.message : 'failed'}`)
        }
      }
      setUrls('')
      setMessage(`Queued ${ok} job${ok === 1 ? '' : 's'}.${errors.length ? ` ${errors.join(' ')}` : ''}`)
      reload()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="AI Import"
        description="Paste recipe URLs. The shared Backend pipeline extracts, parses, validates, and enqueues work. Do not paste provider API keys."
        actions={
          <Button variant="outline" asChild>
            <Link to="/recipes/import-review">Review queue</Link>
          </Button>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Enqueue URLs</CardTitle>
          <CardDescription>One URL per line. Exact active URLs return HTTP 409 / duplicate.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1.5">
            <Label htmlFor="import-urls">Recipe URLs</Label>
            <Textarea
              id="import-urls"
              placeholder="https://example.com/recipe/…"
              value={urls}
              onChange={(event) => setUrls(event.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button loading={submitting} onClick={onSubmit} disabled={!urls.trim()}>
              Enqueue
            </Button>
            <Button variant="outline" loading={refreshing} onClick={reload}>
              Refresh jobs
            </Button>
          </div>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>

      {loading ? <LoadingBlock label="Loading import jobs…" /> : null}
      {error ? (
        <ErrorState title="Could not load import jobs" description={error} onRetry={reload} />
      ) : null}
      {!loading && !error && data?.length === 0 ? (
        <EmptyState title="No import jobs" description="Queued jobs appear here after enqueue." />
      ) : null}

      {data && data.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="max-w-md truncate font-mono text-xs">
                  {job.sourceUrl ?? job.sourceType}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{job.status}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{job.stage}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(job.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </div>
  )
}

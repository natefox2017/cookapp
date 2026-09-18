import { useState } from 'react'
import { listRuntimeConfig, updateRuntimeConfig } from '@/api/ops'
import { isMockMode } from '@/api/client'
import { useAsyncData } from '@/hooks/use-async-data'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState, ErrorState, LoadingBlock, PendingApiNotice } from '@/components/ui/page'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

function formatValue(value: unknown): string {
  if (value == null) return '—'
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export function RuntimeConfigPanel() {
  const { data, loading, error, reload, refreshing } = useAsyncData(() => listRuntimeConfig(), [])
  const [busyKey, setBusyKey] = useState<string | null>(null)

  if (loading) return <LoadingBlock label="Loading runtime config…" />
  if (error) {
    return (
      <ErrorState title="Runtime config unavailable" description={error} onRetry={reload} />
    )
  }

  async function onToggleBool(key: string, current: unknown) {
    if (typeof current !== 'boolean') return
    setBusyKey(key)
    try {
      await updateRuntimeConfig(key, !current)
      reload()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Runtime Config</CardTitle>
          <CardDescription>
            Feature flags and operational knobs from admin-catalog/runtime-config. Empty or missing
            API surfaces as No Data — never invent production values.
          </CardDescription>
        </CardHeader>
      </Card>

      {isMockMode() ? (
        <PendingApiNotice message="Mock mode shows sample keys for local UI only. Live values come from admin-catalog." />
      ) : null}

      <div className="mb-3 flex justify-end">
        <Button variant="outline" loading={refreshing} onClick={reload}>
          Refresh
        </Button>
      </div>

      {!data?.length ? (
        <EmptyState
          title="No Data"
          description="No runtime config rows returned. API may be pending or empty."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="font-mono text-xs">{row.key}</TableCell>
                <TableCell className="max-w-xs truncate font-mono text-xs">
                  {formatValue(row.value)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.description ?? '—'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(row.updatedAt)}
                </TableCell>
                <TableCell>
                  {typeof row.value === 'boolean' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={busyKey === row.key}
                      onClick={() => onToggleBool(row.key, row.value)}
                    >
                      Toggle
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Read-only</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Admin AI Import destination must remain <code>system_recommended</code> — never write into
        user private recipes.
      </p>
    </div>
  )
}

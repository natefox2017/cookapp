import { useState } from 'react'
import { Plug, RefreshCw } from 'lucide-react'
import {
  listIntegrations,
  testIntegration,
  writeIntegrationSecret,
} from '@/api/integrations'
import { isMockMode } from '@/api/client'
import { useAsyncData } from '@/hooks/use-async-data'
import type {
  IntegrationConnectionStatus,
  IntegrationId,
  IntegrationStatus,
} from '@/types/integrations'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorState, LoadingBlock } from '@/components/ui/page'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'

function statusVariant(
  status: IntegrationConnectionStatus,
): 'success' | 'warning' | 'destructive' | 'secondary' | 'outline' {
  if (status === 'connected') return 'success'
  if (status === 'degraded') return 'warning'
  if (status === 'not_configured') return 'secondary'
  return 'outline'
}

function statusLabel(status: IntegrationConnectionStatus): string {
  if (status === 'connected') return 'Connected'
  if (status === 'degraded') return 'Degraded'
  if (status === 'not_configured') return 'Not configured'
  return 'Future reserved'
}

function IntegrationCard({
  item,
  testing,
  onTest,
  onConfigureSecret,
}: {
  item: IntegrationStatus
  testing: boolean
  onTest: (id: IntegrationId) => void
  onConfigureSecret: (id: IntegrationId) => void
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Plug className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate">{item.name}</span>
            </CardTitle>
            <CardDescription className="mt-1">
              {item.notes ?? 'Connection status from live Admin API.'}
            </CardDescription>
          </div>
          <Badge variant={statusVariant(item.status)}>{statusLabel(item.status)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="mt-auto flex flex-1 flex-col gap-4">
        <div className="grid gap-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Config completeness</span>
            <span className="font-medium tabular-nums">{item.configCompleteness.percent}%</span>
          </div>
          <Progress value={item.configCompleteness.percent} aria-label="Config completeness" />
          {item.reserved ? (
            <p className="text-xs text-muted-foreground">N/A — Future reserved (not connected)</p>
          ) : item.configCompleteness.missing.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Missing: {item.configCompleteness.missing.join(', ')}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">All required keys present</p>
          )}
        </div>

        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Secret</dt>
            <dd className="font-medium">
              {item.secretConfigured ? '•••••••• configured' : 'Not configured'}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Last success</dt>
            <dd className="tabular-nums">
              {item.lastSuccessAt ? formatDate(item.lastSuccessAt) : '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Last error</dt>
            <dd className="max-w-[60%] truncate text-right" title={item.lastErrorMessage ?? undefined}>
              {item.lastErrorMessage
                ? item.lastErrorMessage
                : item.lastErrorAt
                  ? formatDate(item.lastErrorAt)
                  : '—'}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex flex-wrap gap-2">
          {item.testSupported ? (
            <Button
              size="sm"
              variant="outline"
              loading={testing}
              disabled={item.reserved || testing}
              onClick={() => onTest(item.id)}
            >
              Test connection
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              Test unavailable
            </Button>
          )}
          {item.secretWriteSupported ? (
            <Button size="sm" variant="secondary" onClick={() => onConfigureSecret(item.id)}>
              Update secret
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

export function IntegrationsPanel() {
  const { data, loading, refreshing, error, reload } = useAsyncData(
    () => listIntegrations(),
    [],
  )
  const [testingId, setTestingId] = useState<IntegrationId | null>(null)
  const [testMessage, setTestMessage] = useState<string | null>(null)
  const [secretOpen, setSecretOpen] = useState(false)
  const [secretTarget, setSecretTarget] = useState<IntegrationId | null>(null)
  const [issuerId, setIssuerId] = useState('')
  const [keyId, setKeyId] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [secretSaving, setSecretSaving] = useState(false)
  const [secretMessage, setSecretMessage] = useState<string | null>(null)
  const [secretError, setSecretError] = useState<string | null>(null)

  async function onTest(id: IntegrationId) {
    setTestingId(id)
    setTestMessage(null)
    try {
      const result = await testIntegration(id)
      setTestMessage(`${result.integration.name}: ${result.message}`)
      await reload()
    } catch (err) {
      setTestMessage(err instanceof Error ? err.message : 'Test failed')
    } finally {
      setTestingId(null)
    }
  }

  function openSecretDialog(id: IntegrationId) {
    setSecretTarget(id)
    setIssuerId('')
    setKeyId('')
    setPrivateKey('')
    setSecretMessage(null)
    setSecretError(null)
    setSecretOpen(true)
  }

  async function onSaveSecret() {
    if (!secretTarget) return
    setSecretError(null)
    setSecretMessage(null)
    if (!privateKey.trim()) {
      setSecretError('Private key is required (write-only; never stored in the browser).')
      return
    }
    setSecretSaving(true)
    try {
      await writeIntegrationSecret(secretTarget, {
        privateKey: privateKey.trim(),
        issuerId: issuerId.trim() || undefined,
        keyId: keyId.trim() || undefined,
      })
      setPrivateKey('')
      setSecretMessage('Secret updated. Plaintext was not returned by the API.')
      setSecretOpen(false)
      await reload()
    } catch (err) {
      setSecretError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSecretSaving(false)
    }
  }

  if (loading && !data) return <LoadingBlock label="Loading integrations…" />
  if ((error && !data) || !data) {
    return (
      <ErrorState
        title="Could not load integrations"
        description={error ?? 'Missing integrations status'}
        onRetry={reload}
      />
    )
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {isMockMode()
              ? 'Mock mode (dev only): statuses are fixtures — Production forbids fake “connected” KPI.'
              : 'Live connection status from Admin Integrations API. Secrets are write-only.'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Checked {formatDate(data.checkedAt)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          loading={refreshing}
          disabled={refreshing}
          onClick={() => void reload()}
        >
          <RefreshCw className="size-3.5" aria-hidden />
          Refresh
        </Button>
      </div>

      {testMessage ? (
        <p className="rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground" role="status">
          {testMessage}
        </p>
      ) : null}
      {secretMessage ? (
        <p className="rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground" role="status">
          {secretMessage}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.integrations.map((item) => (
          <IntegrationCard
            key={item.id}
            item={item}
            testing={testingId === item.id}
            onTest={onTest}
            onConfigureSecret={openSecretDialog}
          />
        ))}
      </div>

      <Dialog open={secretOpen} onOpenChange={setSecretOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update App Store Connect secret</DialogTitle>
            <DialogDescription>
              Write-only. The API never returns the private key. Issuer ID and Key ID are stored as
              non-secret config.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="asc-issuer">Issuer ID</Label>
              <Input
                id="asc-issuer"
                value={issuerId}
                onChange={(e) => setIssuerId(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="asc-key">Key ID</Label>
              <Input
                id="asc-key"
                value={keyId}
                onChange={(e) => setKeyId(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="asc-pk">Private key (.p8)</Label>
              <textarea
                id="asc-pk"
                className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="-----BEGIN PRIVATE KEY-----"
                spellCheck={false}
                autoComplete="off"
              />
            </div>
            {secretError ? <p className="text-sm text-destructive">{secretError}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSecretOpen(false)}>
              Cancel
            </Button>
            <Button loading={secretSaving} onClick={() => void onSaveSecret()}>
              Save secret
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

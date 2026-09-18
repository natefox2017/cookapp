import { useState } from 'react'
import {
  getAiUsage,
  listAiHealth,
  listAiModels,
  listAiProviders,
  listAiRoutes,
  testAiProvider,
  writeAiProviderSecret,
} from '@/api/ops'
import { useAsyncData } from '@/hooks/use-async-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorState, LoadingBlock } from '@/components/ui/page'
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

export function AiPlatformPanel() {
  const providers = useAsyncData(() => listAiProviders(), [])
  const models = useAsyncData(() => listAiModels(), [])
  const routes = useAsyncData(() => listAiRoutes(), [])
  const usage = useAsyncData(() => getAiUsage(), [])
  const health = useAsyncData(() => listAiHealth(), [])
  const [secret, setSecret] = useState('')
  const [secretProvider, setSecretProvider] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)

  const providerRows = providers.data ?? []
  const selectedProvider = secretProvider || providerRows[0]?.id || ''

  async function onSaveSecret() {
    if (!selectedProvider || !secret.trim()) return
    setSaving(true)
    try {
      await writeAiProviderSecret(selectedProvider, secret.trim())
      setSecret('')
      providers.reload()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not store secret')
    } finally {
      setSaving(false)
    }
  }

  async function onTest(id: string) {
    setTesting(id)
    try {
      const result = await testAiProvider(id)
      window.alert(result.ok ? `Connected (${result.latencyMs ?? '?'} ms)` : 'Test failed')
      health.reload()
      providers.reload()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Test failed')
    } finally {
      setTesting(null)
    }
  }

  if (providers.loading) return <LoadingBlock label="Loading AI platform…" />
  if (providers.error) {
    return (
      <ErrorState
        title="AI Platform unavailable"
        description={providers.error}
        onRetry={providers.reload}
      />
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Providers</CardTitle>
          <CardDescription>
            Secrets are write-only. The Admin browser never receives provider API keys or a full secret.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Base URL</TableHead>
                <TableHead>Secret</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Test</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(providers.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No providers configured. Add them via Admin AI APIs / Owner bootstrap.
                  </TableCell>
                </TableRow>
              ) : (
                (providers.data ?? []).map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell>{provider.name}</TableCell>
                    <TableCell className="max-w-xs truncate font-mono text-xs">{provider.baseUrl}</TableCell>
                    <TableCell>
                      <Badge variant={provider.secretConfigured ? 'success' : 'secondary'}>
                        {provider.secretConfigured ? 'configured' : 'missing'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{provider.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        loading={testing === provider.id}
                        onClick={() => onTest(provider.id)}
                      >
                        Test
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="grid max-w-xl gap-2">
            <Label htmlFor="ai-secret-provider">Write secret (Owner)</Label>
            <Select
              value={selectedProvider}
              onValueChange={setSecretProvider}
              disabled={providerRows.length === 0 || saving}
            >
              <SelectTrigger id="ai-secret-provider" aria-label="AI provider">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {providerRows.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="ai-secret"
              type="password"
              autoComplete="new-password"
              placeholder="Paste secret — it will not be shown again"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              disabled={!selectedProvider || saving}
            />
            <Button
              className="w-fit"
              loading={saving}
              disabled={!selectedProvider || !secret.trim()}
              onClick={onSaveSecret}
            >
              Store secret
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Models</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Display</TableHead>
                  <TableHead>Upstream</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(models.data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground">
                      No models configured.
                    </TableCell>
                  </TableRow>
                ) : (
                  (models.data ?? []).map((model) => (
                    <TableRow key={model.id}>
                      <TableCell>{model.displayName}</TableCell>
                      <TableCell className="font-mono text-xs">{model.upstreamModelId}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Primary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(routes.data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground">
                      No routes configured.
                    </TableCell>
                  </TableRow>
                ) : (
                  (routes.data ?? []).map((route) => (
                    <TableRow key={route.routeKey}>
                      <TableCell className="font-mono text-xs">{route.routeKey}</TableCell>
                      <TableCell className="font-mono text-xs">{route.primaryModelId ?? '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage / health</CardTitle>
          <CardDescription>
            {usage.data
              ? `${usage.data.requestCount ?? 0} requests · ${usage.data.errorCount ?? 0} errors`
              : 'No usage summary'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(health.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    No health rows yet.
                  </TableCell>
                </TableRow>
              ) : (
                (health.data ?? []).map((row) => (
                  <TableRow key={row.providerId}>
                    <TableCell className="font-mono text-xs">{row.providerId}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.lastError ?? '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

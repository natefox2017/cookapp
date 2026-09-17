import { useEffect, useState } from 'react'
import { getSettings, updateSettings } from '@/api'
import { useAsyncData } from '@/hooks/use-async-data'
import type { AdminSettings } from '@/types/admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState, LoadingBlock, PageHeader } from '@/components/ui/page'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function SettingsPage() {
  const { data, loading, error, reload } = useAsyncData(() => getSettings(), [])
  const [draft, setDraft] = useState<AdminSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data) setDraft(structuredClone(data))
  }, [data])

  async function onSave() {
    if (!draft) return
    setSaving(true)
    setSaved(false)
    try {
      const next = await updateSettings(draft)
      setDraft(next)
      setSaved(true)
      reload()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingBlock label="Loading settings…" />
  if (error || !draft) {
    return <EmptyState title="Could not load settings" description={error ?? 'Missing settings'} />
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="General, units, category policy, and system configuration."
        actions={
          <Button loading={saving} onClick={onSave}>
            {saved ? 'Saved' : 'Save changes'}
          </Button>
        }
      />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>App identity and support contact</CardDescription>
            </CardHeader>
            <CardContent className="grid max-w-xl gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="appName">App name</Label>
                <Input
                  id="appName"
                  value={draft.general.appName}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      general: { ...draft.general, appName: event.target.value },
                    })
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="supportEmail">Support email</Label>
                <Input
                  id="supportEmail"
                  value={draft.general.supportEmail}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      general: { ...draft.general, supportEmail: event.target.value },
                    })
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="locale">Default locale</Label>
                <Input
                  id="locale"
                  value={draft.general.defaultLocale}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      general: { ...draft.general, defaultLocale: event.target.value },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <div className="text-sm font-medium">Maintenance mode</div>
                  <div className="text-xs text-muted-foreground">Disable write traffic when enabled</div>
                </div>
                <Switch
                  checked={draft.general.maintenanceMode}
                  onCheckedChange={(checked) =>
                    setDraft({
                      ...draft,
                      general: { ...draft.general, maintenanceMode: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units">
          <Card>
            <CardHeader>
              <CardTitle>Units</CardTitle>
              <CardDescription>Default measurement preferences</CardDescription>
            </CardHeader>
            <CardContent className="grid max-w-xl gap-4">
              <div className="grid gap-1.5">
                <Label>Measurement system</Label>
                <Select
                  value={draft.units.measurementSystem}
                  onValueChange={(value) =>
                    setDraft({
                      ...draft,
                      units: {
                        ...draft.units,
                        measurementSystem: value as AdminSettings['units']['measurementSystem'],
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric</SelectItem>
                    <SelectItem value="imperial">Imperial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Temperature unit</Label>
                <Select
                  value={draft.units.temperatureUnit}
                  onValueChange={(value) =>
                    setDraft({
                      ...draft,
                      units: {
                        ...draft.units,
                        temperatureUnit: value as AdminSettings['units']['temperatureUnit'],
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="celsius">Celsius</SelectItem>
                    <SelectItem value="fahrenheit">Fahrenheit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Taxonomy policy toggles</CardDescription>
            </CardHeader>
            <CardContent className="grid max-w-xl gap-3">
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <div className="text-sm font-medium">Allow user tags</div>
                  <div className="text-xs text-muted-foreground">Users may create free-form tags</div>
                </div>
                <Switch
                  checked={draft.categories.allowUserTags}
                  onCheckedChange={(checked) =>
                    setDraft({
                      ...draft,
                      categories: { ...draft.categories, allowUserTags: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <div className="text-sm font-medium">Require cuisine</div>
                  <div className="text-xs text-muted-foreground">Recipes must set a cuisine</div>
                </div>
                <Switch
                  checked={draft.categories.requireCuisine}
                  onCheckedChange={(checked) =>
                    setDraft({
                      ...draft,
                      categories: { ...draft.categories, requireCuisine: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System</CardTitle>
              <CardDescription>API mode and logging</CardDescription>
            </CardHeader>
            <CardContent className="grid max-w-xl gap-4">
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <div className="text-sm font-medium">Mock mode</div>
                  <div className="text-xs text-muted-foreground">
                    Controlled by VITE_ADMIN_USE_MOCK at build time
                  </div>
                </div>
                <Switch checked={draft.system.mockMode} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="apiBase">API base URL</Label>
                <Input
                  id="apiBase"
                  value={draft.system.apiBaseUrl}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      system: { ...draft.system, apiBaseUrl: event.target.value },
                    })
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Log level</Label>
                <Select
                  value={draft.system.logLevel}
                  onValueChange={(value) =>
                    setDraft({
                      ...draft,
                      system: {
                        ...draft.system,
                        logLevel: value as AdminSettings['system']['logLevel'],
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debug">debug</SelectItem>
                    <SelectItem value="info">info</SelectItem>
                    <SelectItem value="warn">warn</SelectItem>
                    <SelectItem value="error">error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSettings, isMockMode, updateSettings, writeCapability } from '@/api'
import { useAsyncData } from '@/hooks/use-async-data'
import { authErrorMessage, useAuth } from '@/auth/auth-context'
import type { AdminSettings } from '@/types/admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorState, LoadingBlock, PageHeader, PendingApiNotice } from '@/components/ui/page'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { validateAdminPassword } from '@/lib/password-policy'
import { IntegrationsPanel } from '@/pages/settings/integrations-panel'

export type SettingsSection = 'general' | 'security' | 'system' | 'integrations'
type SettingsTab = SettingsSection | 'units' | 'categories'

export function SettingsPage({ section = 'general' }: { section?: SettingsSection }) {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsyncData(() => getSettings(), [])
  const { admin, changePassword } = useAuth()
  const [draft, setDraft] = useState<AdminSettings | null>(null)
  const [baseline, setBaseline] = useState<AdminSettings | null>(null)
  const [tab, setTab] = useState<SettingsTab>(section)
  const [saving, setSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  useEffect(() => {
    if (data) {
      const next = structuredClone(data)
      setDraft(next)
      setBaseline(structuredClone(data))
    }
  }, [data])

  useEffect(() => {
    setTab(section)
  }, [section])

  function onTabChange(next: string) {
    const nextTab = next as SettingsTab
    setTab(nextTab)
    if (nextTab === 'security' || nextTab === 'system' || nextTab === 'integrations') {
      navigate(`/settings/${nextTab}`, { replace: true })
      return
    }
    // general + units + categories stay under Settings → General (existing capability tabs)
    if (section !== 'general') {
      navigate('/settings/general', { replace: true })
    }
  }

  const dirty =
    Boolean(draft && baseline) && JSON.stringify(draft) !== JSON.stringify(baseline)

  async function onSave() {
    if (!draft) return
    setSaving(true)
    try {
      const next = await updateSettings(draft)
      setDraft(structuredClone(next))
      setBaseline(structuredClone(next))
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function onChangePassword() {
    setPasswordMessage(null)
    setPasswordError(null)
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match')
      return
    }
    const strength = validateAdminPassword(newPassword)
    if (!strength.ok) {
      setPasswordError(strength.message ?? 'Weak password')
      return
    }
    setPasswordSaving(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage('Password updated. Your session was refreshed.')
    } catch (err) {
      setPasswordError(authErrorMessage(err))
    } finally {
      setPasswordSaving(false)
    }
  }

  if (loading && !draft) return <LoadingBlock label="Loading settings…" />
  if ((error && !draft) || !draft) {
    return (
      <ErrorState
        title="Could not load settings"
        description={error ?? 'Missing settings'}
        onRetry={reload}
      />
    )
  }

  const persist = writeCapability('settings-persist', isMockMode())
  const persistLocked = !persist.canWrite
  const systemLocked = !isMockMode()
  const showSettingsSave =
    tab !== 'security' &&
    tab !== 'integrations' &&
    (tab === 'system' ? isMockMode() : persist.canWrite)
  const persistNotice =
    persistLocked && tab !== 'security' && tab !== 'integrations'
      ? `${persist.reason} These fields are read-only diagnostics.`
      : systemLocked && tab === 'system'
        ? 'System is live diagnostics (build-time API mode). Log level is read-only in live mode.'
        : null

  return (
    <div>
      <PageHeader
        title="Settings"
        description={
          persistLocked
            ? 'Live mode: Security uses admin-auth; Integrations uses admin-integrations. General/units/categories are diagnostics-only (no persist API).'
            : systemLocked
              ? 'General, units, and category policy persist via admin-catalog. System is live diagnostics. Security and Integrations stay live.'
              : 'General, units, category policy, integrations, and system configuration.'
        }
        actions={
          showSettingsSave ? (
            <Button loading={saving} onClick={onSave} disabled={!dirty && !saving}>
              {dirty ? 'Save changes' : 'Saved'}
            </Button>
          ) : null
        }
      />
      {persistNotice ? <PendingApiNotice message={persistNotice} /> : null}

      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
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
                  disabled={persistLocked}
                  readOnly={persistLocked}
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
                  disabled={persistLocked}
                  readOnly={persistLocked}
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
                  disabled={persistLocked}
                  readOnly={persistLocked}
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
                  <div id="maintenance-mode-label" className="text-sm font-medium">
                    Maintenance mode
                  </div>
                  <div className="text-xs text-muted-foreground">Disable write traffic when enabled</div>
                </div>
                <Switch
                  id="maintenance-mode"
                  aria-labelledby="maintenance-mode-label"
                  checked={draft.general.maintenanceMode}
                  disabled={persistLocked}
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
                <Label htmlFor="measurement-system">Measurement system</Label>
                <Select
                  value={draft.units.measurementSystem}
                  disabled={persistLocked}
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
                  <SelectTrigger id="measurement-system">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric</SelectItem>
                    <SelectItem value="imperial">Imperial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="temperature-unit">Temperature unit</Label>
                <Select
                  value={draft.units.temperatureUnit}
                  disabled={persistLocked}
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
                  <SelectTrigger id="temperature-unit">
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
                  <div id="allow-user-tags-label" className="text-sm font-medium">
                    Allow user tags
                  </div>
                  <div className="text-xs text-muted-foreground">Users may create free-form tags</div>
                </div>
                <Switch
                  id="allow-user-tags"
                  aria-labelledby="allow-user-tags-label"
                  checked={draft.categories.allowUserTags}
                  disabled={persistLocked}
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
                  <div id="require-cuisine-label" className="text-sm font-medium">
                    Require cuisine
                  </div>
                  <div className="text-xs text-muted-foreground">Recipes must set a cuisine</div>
                </div>
                <Switch
                  id="require-cuisine"
                  aria-labelledby="require-cuisine-label"
                  checked={draft.categories.requireCuisine}
                  disabled={persistLocked}
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

        <TabsContent value="integrations">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>
                Connection status for Supabase, RevenueCat, App Store Connect, and AI Gateway.
                Google Play remains Future Reserved / Not Connected. Secrets are write-only.
              </CardDescription>
            </CardHeader>
          </Card>
          <IntegrationsPanel />
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Change the admin console password for{' '}
                <span className="font-mono">{admin?.username ?? 'admin'}</span>.
                Requires 12+ characters with upper, lower, and a digit. All sessions
                are revoked on change.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid max-w-xl gap-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  void onChangePassword()
                }}
              >
                <div className="grid gap-1.5">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>
                {passwordError ? <p className="text-sm text-destructive">{passwordError}</p> : null}
                {passwordMessage ? (
                  <p className="text-sm text-muted-foreground">{passwordMessage}</p>
                ) : null}
                <div>
                  <Button
                    type="submit"
                    loading={passwordSaving}
                    disabled={!currentPassword || !newPassword || !confirmPassword}
                  >
                    Update password
                  </Button>
                </div>
              </form>
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
                  <div id="mock-mode-label" className="text-sm font-medium">
                    Mock mode
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Dev-only. Production builds forbid mock KPI/data (Issue #51).
                  </div>
                </div>
                <Switch
                  id="mock-mode"
                  aria-labelledby="mock-mode-label"
                  checked={draft.system.mockMode}
                  disabled
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="apiBase">API base URL</Label>
                <Input
                  id="apiBase"
                  value={draft.system.apiBaseUrl}
                  readOnly
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Set via VITE_ADMIN_API_BASE_URL at build time (not editable at runtime).
                </p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="log-level">Log level</Label>
                <Select
                  value={draft.system.logLevel}
                  disabled={systemLocked}
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
                  <SelectTrigger id="log-level">
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

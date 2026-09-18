import { Link } from 'react-router-dom'
import { getSubscriptionRevenue, listSubscriptions } from '@/api'
import { useAsyncData } from '@/hooks/use-async-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState, LoadingBlock, PageHeader } from '@/components/ui/page'
import { formatMoney, formatNumber } from '@/lib/utils'

export function CommerceOverviewPage() {
  const revenue = useAsyncData(() => getSubscriptionRevenue(), [])
  const subs = useAsyncData(() => listSubscriptions({}), [])

  if (revenue.loading || subs.loading) return <LoadingBlock label="Loading commerce…" />
  if (revenue.error || !revenue.data) {
    return (
      <ErrorState
        title="Commerce overview unavailable"
        description={revenue.error ?? 'No revenue payload.'}
        onRetry={revenue.reload}
      />
    )
  }

  const { stats } = revenue.data

  return (
    <div>
      <PageHeader
        title="Commerce Overview"
        description="MRR, paid subscribers, and store revenue from normalized commerce sources. Google Play stays Future Reserved."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/commerce/subscriptions">Subscriptions</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/commerce/payments">Payments</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/commerce/products">Products & Plans</Link>
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="MRR (est.)"
          value={formatMoney(stats.mrr)}
          hint="Active paid monthlyized · RevenueCat / payment_transactions"
        />
        <Kpi
          label="Active paid"
          value={formatNumber(stats.activePaid)}
          hint="Current entitlements"
        />
        <Kpi
          label="Apple revenue"
          value={formatMoney(stats.appleRevenue)}
          hint="Estimated until Financial Reports"
        />
        <Kpi
          label="Google Play"
          value="Not Connected"
          hint="Future Reserved — never fake Android zeros"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Source & freshness</CardTitle>
          <CardDescription>
            Subscription rows loaded: {subs.data?.length ?? '—'} · Drill
            into Payments for transactions. Missing store sync shows Not Connected, not 0.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">source: admin-subscriptions</Badge>
          <Badge variant="secondary">android: future_reserved</Badge>
        </CardContent>
      </Card>
    </div>
  )
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{hint}</CardContent>
    </Card>
  )
}

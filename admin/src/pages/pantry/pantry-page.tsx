import { listPantry } from '@/api'
import { useAsyncData } from '@/hooks/use-async-data'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { EmptyState, ErrorState, LoadingBlock, PageHeader } from '@/components/ui/page'
import { formatDate } from '@/lib/utils'

export function PantryPage() {
  const { data, loading, error, reload } = useAsyncData(() => listPantry(), [])

  return (
    <div>
      <PageHeader
        title="Pantry"
        description="Stock levels, units, and expiration freshness."
      />

      {loading ? <LoadingBlock label="Loading pantry…" /> : null}
      {error ? (
        <ErrorState title="Could not load pantry" description={error} onRetry={reload} />
      ) : null}
      {!loading && !error && data?.length === 0 ? (
        <EmptyState title="Pantry is empty" description="No pantry stock records were returned." />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data?.map((item) => (
          <Card key={item.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{item.ingredient}</CardTitle>
                <Badge
                  variant={
                    item.freshnessPercent < 30
                      ? 'destructive'
                      : item.freshnessPercent < 60
                        ? 'warning'
                        : 'success'
                  }
                >
                  {item.freshnessPercent}% left
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-semibold tabular-nums">{item.quantity}</div>
                  <div className="text-xs text-muted-foreground">{item.unit}</div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  Expires
                  <div className="font-medium text-foreground">{formatDate(item.expirationDate)}</div>
                </div>
              </div>
              <Progress value={item.freshnessPercent} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

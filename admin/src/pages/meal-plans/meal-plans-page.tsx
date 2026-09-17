import { useMemo, useState } from 'react'
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { listMealPlans } from '@/api'
import { useAsyncData } from '@/hooks/use-async-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState, ErrorState, LoadingBlock, PageHeader } from '@/components/ui/page'
import { cn } from '@/lib/utils'

export function MealPlansPage() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date('2026-03-01')))
  const { data, loading, error, reload } = useAsyncData(() => listMealPlans(), [])

  const byDate = useMemo(() => {
    const map = new Map(data?.map((entry) => [entry.date, entry]) ?? [])
    return map
  }, [data])

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor))
    const end = endOfWeek(endOfMonth(cursor))
    return eachDayOfInterval({ start, end })
  }, [cursor])

  return (
    <div>
      <PageHeader
        title="Meal Plans"
        description="Calendar layout of breakfast, lunch, and dinner assignments."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous month"
              onClick={() => setCursor((value) => startOfMonth(addDays(value, -1)))}
            >
              <ChevronLeft />
            </Button>
            <div className="min-w-36 text-center text-sm font-medium">
              {format(cursor, 'MMMM yyyy')}
            </div>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next month"
              onClick={() => setCursor((value) => startOfMonth(addDays(endOfMonth(value), 1)))}
            >
              <ChevronRight />
            </Button>
          </div>
        }
      />

      {loading ? <LoadingBlock label="Loading meal plans…" /> : null}
      {error ? (
        <ErrorState title="Could not load meal plans" description={error} onRetry={reload} />
      ) : null}
      {!loading && !error && data?.length === 0 ? (
        <EmptyState
          title="No meal plan entries"
          description="Calendar stays available; meal slots will fill when plan data exists."
        />
      ) : null}

      {!loading && !error ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Weekly meals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
                <div key={label}>{label}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => {
                const key = format(day, 'yyyy-MM-dd')
                const entry = byDate.get(key)
                return (
                  <div
                    key={key}
                    className={cn(
                      'min-h-28 rounded-lg border bg-background p-2',
                      !isSameMonth(day, cursor) && 'opacity-40',
                    )}
                  >
                    <div className="mb-2 text-xs font-semibold tabular-nums">{format(day, 'd')}</div>
                    <div className="space-y-1 text-[11px] leading-snug">
                      <MealSlot label="B" value={entry?.breakfast} />
                      <MealSlot label="L" value={entry?.lunch} />
                      <MealSlot label="D" value={entry?.dinner} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function MealSlot({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="truncate">
      <span className="font-semibold text-primary">{label}</span>{' '}
      <span className="text-muted-foreground">{value ?? '—'}</span>
    </div>
  )
}

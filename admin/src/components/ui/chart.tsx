import * as React from 'react'
import * as RechartsPrimitive from 'recharts'
import { cn } from '@/lib/utils'

export type ChartConfig = Record<
  string,
  {
    label?: string
    color?: string
  }
>

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: ChartConfig
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children']
  }
>(({ id, className, children, config, ...props }, ref) => {
  const chartId = React.useId()
  const uniqueId = id || chartId.replace(/:/g, '')

  return (
    <div
      data-chart={uniqueId}
      ref={ref}
      className={cn('flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground', className)}
      style={
        {
          ...Object.fromEntries(
            Object.entries(config).map(([key, value]) => [
              `--color-${key}`,
              value.color ?? 'var(--chart-1)',
            ]),
          ),
        } as React.CSSProperties
      }
      {...props}
    >
      <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
        {children}
      </RechartsPrimitive.ResponsiveContainer>
    </div>
  )
})
ChartContainer.displayName = 'ChartContainer'

const ChartTooltip = RechartsPrimitive.Tooltip

function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number | string; color?: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md">
      {label ? <div className="mb-1 text-xs text-muted-foreground">{label}</div> : null}
      <div className="grid gap-1">
        {payload.map((item) => (
          <div key={String(item.name)} className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
            <span className="text-muted-foreground">{item.name}</span>
            <span className="font-medium tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export { ChartContainer, ChartTooltip, ChartTooltipContent }

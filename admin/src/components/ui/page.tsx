import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-16 text-center">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
}: {
  title?: string
  description: string
  onRetry?: () => void
}) {
  const pending =
    /not implemented/i.test(description) || /live admin api/i.test(description)
  return (
    <EmptyState
      title={pending ? 'Live API pending' : title}
      description={description}
      action={
        onRetry && !pending ? (
          <Button variant="outline" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    />
  )
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-xl border bg-card text-sm text-muted-foreground">
      {label}
    </div>
  )
}

export function PendingApiNotice({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="mb-4 rounded-lg border border-dashed bg-card px-3 py-2 text-sm text-muted-foreground"
    >
      {message}
    </div>
  )
}

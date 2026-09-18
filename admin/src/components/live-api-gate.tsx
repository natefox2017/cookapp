import type { ReactNode } from 'react'
import { isMockMode } from '@/api'
import { NotImplementedState, PageHeader } from '@/components/ui/page'

/** Renders Not Implemented in Production live mode when no Admin Edge Function exists. */
export function LiveApiGate({
  domain,
  title,
  description,
  children,
}: {
  domain: string
  title: string
  description?: string
  children?: ReactNode
}) {
  if (!isMockMode()) {
    return (
      <div>
        <PageHeader title={title} description={description} />
        <NotImplementedState domain={domain} />
      </div>
    )
  }
  return <>{children}</>
}

import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page'

export function NotImplementedPage({
  title,
  description,
  contractNote,
  relatedHref,
  relatedLabel,
}: {
  title: string
  description: string
  /** Short pointer to Backend V2 / contract — keeps empty menus from looking “done”. */
  contractNote?: string
  relatedHref?: string
  relatedLabel?: string
}) {
  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Badge variant="warning" className="uppercase tracking-wide">
            Not implemented
          </Badge>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Live Admin UI pending</CardTitle>
          <CardDescription>
            This nav entry is reserved for Backend/Admin V2. It is reachable so IA stays complete,
            but it is not an operational console yet — no mock KPI or fake success state.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {contractNote ? <p>{contractNote}</p> : null}
          <p>
            See{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">docs/backend/ADMIN_API_CONTRACT.md</code>{' '}
            and Notion V2 §14. Parent tracking: Issue #49.
          </p>
          {relatedHref && relatedLabel ? (
            <Button asChild variant="outline" size="sm">
              <Link to={relatedHref}>{relatedLabel}</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

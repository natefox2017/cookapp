import { listCollections } from '@/api'
import { useAsyncData } from '@/hooks/use-async-data'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState, LoadingBlock, PageHeader } from '@/components/ui/page'
import { formatDate } from '@/lib/utils'

export function CollectionsPage() {
  const { data, loading, error } = useAsyncData(() => listCollections(), [])

  return (
    <div>
      <PageHeader
        title="Collections"
        description="User recipe collections with cover, owner, and counts."
      />

      {loading ? <LoadingBlock label="Loading collections…" /> : null}
      {error ? <EmptyState title="Could not load collections" description={error} /> : null}
      {!loading && !error && data?.length === 0 ? (
        <EmptyState title="No collections" description="No recipe collections were returned." />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data?.map((collection) => (
          <Card key={collection.id} className="overflow-hidden">
            <div className="aspect-[16/10] bg-muted">
              <img
                src={collection.coverUrl}
                alt={collection.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{collection.name}</h3>
                <Badge variant={collection.isPublic ? 'success' : 'secondary'}>
                  {collection.isPublic ? 'Public' : 'Private'}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback>
                      {collection.owner.displayName
                        .split(' ')
                        .map((part) => part[0])
                        .join('')
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">{collection.owner.displayName}</span>
                </div>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {collection.recipeCount} recipes
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{formatDate(collection.createdAt)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { listGroceryItems, listGroceryUsers } from '@/api'
import { useAsyncData } from '@/hooks/use-async-data'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { EmptyState, LoadingBlock, PageHeader } from '@/components/ui/page'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export function GroceryPage() {
  const users = useAsyncData(() => listGroceryUsers(), [])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedUserId && users.data?.[0]) {
      setSelectedUserId(users.data[0].id)
    }
  }, [users.data, selectedUserId])

  const items = useAsyncData(
    () => (selectedUserId ? listGroceryItems(selectedUserId) : Promise.resolve([])),
    [selectedUserId],
  )

  return (
    <div>
      <PageHeader
        title="Grocery"
        description="Two-column view: users on the left, shopping items on the right."
      />

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-xl border bg-card">
          <div className="border-b px-4 py-3 text-sm font-medium">Users</div>
          {users.loading ? <div className="p-4 text-sm text-muted-foreground">Loading…</div> : null}
          {users.error ? <div className="p-4 text-sm text-destructive">{users.error}</div> : null}
          <div className="divide-y">
            {users.data?.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUserId(user.id)}
                className={cn(
                  'flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-muted/60',
                  selectedUserId === user.id && 'bg-accent',
                )}
              >
                <span className="text-sm font-medium">{user.displayName}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
                <span className="text-xs text-muted-foreground">
                  {user.completedCount}/{user.itemCount} completed
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card">
          <div className="border-b px-4 py-3 text-sm font-medium">Shopping items</div>
          {items.loading ? <LoadingBlock label="Loading items…" /> : null}
          {items.error ? <EmptyState title="Could not load items" description={items.error} /> : null}
          {!items.loading && !items.error && items.data?.length === 0 ? (
            <EmptyState title="No grocery items" description="Select another user or wait for list data." />
          ) : null}
          {items.data && items.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Done</TableHead>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox checked={item.completed} disabled aria-label={`${item.ingredient} completed`} />
                    </TableCell>
                    <TableCell className="font-medium">{item.ingredient}</TableCell>
                    <TableCell className="tabular-nums text-primary">{item.quantity}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.completed ? 'success' : 'outline'}>
                        {item.completed ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </div>
      </div>
    </div>
  )
}

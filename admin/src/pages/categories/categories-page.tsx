import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  createTaxonomyItem,
  deleteTaxonomyItem,
  isMockMode,
  listTaxonomy,
  updateTaxonomyItem,
  writeCapability,
} from '@/api'
import { useAsyncData } from '@/hooks/use-async-data'
import type { TaxonomyItem } from '@/types/admin'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState, ErrorState, LoadingBlock, PageHeader, PendingApiNotice } from '@/components/ui/page'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Kind = 'cuisine' | 'category' | 'tags'

function TaxonomyTable({ kind }: { kind: Kind }) {
  const { data, loading, error, reload } = useAsyncData(() => listTaxonomy(kind), [kind])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TaxonomyItem | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const capability = writeCapability('categories', isMockMode())

  function openCreate() {
    if (!capability.canWrite) return
    setEditing(null)
    setName('')
    setOpen(true)
  }

  function openEdit(item: TaxonomyItem) {
    if (!capability.canWrite) return
    setEditing(item)
    setName(item.name)
    setOpen(true)
  }

  async function onSave() {
    const nextName = name.trim()
    if (!nextName) {
      window.alert('Name is required.')
      return
    }
    setSaving(true)
    try {
      if (editing) await updateTaxonomyItem(kind, editing.id, nextName)
      else await createTaxonomyItem(kind, nextName)
      setOpen(false)
      reload()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(id: string) {
    if (!capability.canWrite) return
    if (!window.confirm('Delete this item?')) return
    try {
      await deleteTaxonomyItem(kind, id)
      reload()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        {capability.canWrite ? (
          <Button size="sm" onClick={openCreate}>
            <Plus />
            Create
          </Button>
        ) : null}
      </div>

      {loading ? <LoadingBlock label="Loading…" /> : null}
      {error ? <ErrorState title="Load failed" description={error} onRetry={reload} /> : null}
      {!loading && !error && data?.length === 0 ? (
        <EmptyState
          title={`No ${kind} items`}
          description={
            capability.canWrite
              ? 'Create the first item to populate this taxonomy.'
              : 'No taxonomy rows. Live write API is pending.'
          }
          action={
            capability.canWrite ? (
              <Button size="sm" onClick={openCreate}>
                <Plus />
                Create
              </Button>
            ) : undefined
          }
        />
      ) : null}

      {data && data.length > 0 ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Usage</TableHead>
                {capability.canWrite ? <TableHead className="w-28">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="font-mono text-xs">{item.slug}</TableCell>
                  <TableCell className="tabular-nums">{item.usageCount}</TableCell>
                  {capability.canWrite ? (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => openEdit(item)}>
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete"
                          onClick={() => onDelete(item.id)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <Dialog open={capability.canWrite && open} onOpenChange={(next) => capability.canWrite && setOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Update' : 'Create'} {kind}</DialogTitle>
            <DialogDescription>Taxonomy CRUD for {kind}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5 py-2">
            <Label htmlFor="taxonomy-name">Name</Label>
            <Input id="taxonomy-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} disabled={!name.trim()} onClick={onSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function CategoriesPage({ embedded = false }: { embedded?: boolean }) {
  const capability = writeCapability('categories', isMockMode())
  return (
    <div>
      {!embedded ? (
        <PageHeader
          title="Categories"
          description={
            capability.canWrite
              ? 'Manage cuisine, category, and tag taxonomies.'
              : 'Live Categories API is pending. Taxonomy is read-only until the contract is live.'
          }
        />
      ) : null}
      {capability.reason ? <PendingApiNotice message={capability.reason} /> : null}
      <Tabs defaultValue="cuisine">
        <TabsList>
          <TabsTrigger value="cuisine">Cuisine</TabsTrigger>
          <TabsTrigger value="category">Category</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>
        <TabsContent value="cuisine">
          <TaxonomyTable kind="cuisine" />
        </TabsContent>
        <TabsContent value="category">
          <TaxonomyTable kind="category" />
        </TabsContent>
        <TabsContent value="tags">
          <TaxonomyTable kind="tags" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

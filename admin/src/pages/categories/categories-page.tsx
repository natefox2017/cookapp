import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  createTaxonomyItem,
  deleteTaxonomyItem,
  listTaxonomy,
  updateTaxonomyItem,
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
import { EmptyState, LoadingBlock, PageHeader } from '@/components/ui/page'
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

  function openCreate() {
    setEditing(null)
    setName('')
    setOpen(true)
  }

  function openEdit(item: TaxonomyItem) {
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
        <Button size="sm" onClick={openCreate}>
          <Plus />
          Create
        </Button>
      </div>

      {loading ? <LoadingBlock label="Loading…" /> : null}
      {error ? <EmptyState title="Load failed" description={error} /> : null}
      {!loading && !error && data?.length === 0 ? (
        <EmptyState
          title={`No ${kind} items`}
          description="Create an item to populate this taxonomy."
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus />
              Create
            </Button>
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
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="font-mono text-xs">{item.slug}</TableCell>
                  <TableCell className="tabular-nums">{item.usageCount}</TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
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

export function CategoriesPage() {
  return (
    <div>
      <PageHeader
        title="Categories"
        description="Manage cuisine, category, and tag taxonomies."
      />
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

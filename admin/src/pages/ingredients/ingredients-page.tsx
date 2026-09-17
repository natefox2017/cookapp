import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  createIngredient,
  deleteIngredient,
  listIngredients,
  updateIngredient,
} from '@/api'
import { useAsyncData } from '@/hooks/use-async-data'
import type { Ingredient, IngredientInput } from '@/types/admin'
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

const emptyForm: IngredientInput = {
  name: '',
  category: '',
  unit: '',
  alternativeName: null,
}

export function IngredientsPage() {
  const { data, loading, error, reload } = useAsyncData(() => listIngredients(), [])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Ingredient | null>(null)
  const [form, setForm] = useState<IngredientInput>(emptyForm)
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(item: Ingredient) {
    setEditing(item)
    setForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      alternativeName: item.alternativeName,
    })
    setOpen(true)
  }

  async function onSave() {
    setSaving(true)
    try {
      if (editing) await updateIngredient(editing.id, form)
      else await createIngredient(form)
      setOpen(false)
      reload()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('Delete this ingredient?')) return
    await deleteIngredient(id)
    reload()
  }

  return (
    <div>
      <PageHeader
        title="Ingredients"
        description="Catalog CRUD via /admin/ingredients."
        actions={
          <Button onClick={openCreate}>
            <Plus />
            Add ingredient
          </Button>
        }
      />

      {loading ? <LoadingBlock label="Loading ingredients…" /> : null}
      {error ? <EmptyState title="Could not load ingredients" description={error} /> : null}

      {data && data.length > 0 ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Alternative Name</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.alternativeName ?? '—'}
                  </TableCell>
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
            <DialogTitle>{editing ? 'Update ingredient' : 'Create ingredient'}</DialogTitle>
            <DialogDescription>
              {editing ? 'PUT /admin/ingredients/:id' : 'POST /admin/ingredients'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={form.unit}
                onChange={(event) => setForm((prev) => ({ ...prev, unit: event.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="alt">Alternative Name</Label>
              <Input
                id="alt"
                value={form.alternativeName ?? ''}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    alternativeName: event.target.value || null,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={onSave} disabled={!form.name || !form.category || !form.unit}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { deleteRecipe, getRecipe, isMockMode, listRecipes, listTaxonomy, writeCapability } from '@/api'
import { useAsyncData } from '@/hooks/use-async-data'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EmptyState, ErrorState, LoadingBlock, PageHeader } from '@/components/ui/page'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from '@/lib/utils'

export function RecipesPage() {
  const [q, setQ] = useState('')
  const debouncedQ = useDebouncedValue(q, 250)
  const [cuisine, setCuisine] = useState('all')
  const [category, setCategory] = useState('all')

  const cuisines = useAsyncData(() => listTaxonomy('cuisine'), [])
  const categories = useAsyncData(() => listTaxonomy('category'), [])

  const params = useMemo(
    () => ({
      q: debouncedQ,
      cuisine: cuisine === 'all' ? undefined : cuisine,
      category: category === 'all' ? undefined : category,
    }),
    [debouncedQ, cuisine, category],
  )

  const { data, loading, error, reload } = useAsyncData(() => listRecipes(params), [params])

  return (
    <div>
      <PageHeader
        title="System Recipe Library"
        description="Platform recommended recipes (library_kind=system_recommended). User private recipes are not browsable here."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search system recipes…"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={cuisine} onValueChange={setCuisine}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Cuisine" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cuisines</SelectItem>
            {(cuisines.data ?? []).map((item) => (
              <SelectItem key={item.id} value={item.name}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {(categories.data ?? []).map((item) => (
              <SelectItem key={item.id} value={item.name}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? <LoadingBlock label="Loading system recipes…" /> : null}
      {error ? (
        <ErrorState title="Could not load system recipes" description={error} onRetry={reload} />
      ) : null}
      {!loading && !error && data?.length === 0 ? (
        <EmptyState
          title="No system recipes"
          description="No platform recommended recipes match the current filters."
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data?.map((recipe) => (
          <Link
            key={recipe.id}
            to={`/content/recipes/${recipe.id}`}
            className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="overflow-hidden transition-shadow hover:shadow-md">
              <div className="aspect-[16/10] overflow-hidden bg-muted">
                {recipe.coverUrl ? (
                  <img
                    src={recipe.coverUrl}
                    alt={recipe.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
              </div>
              <CardContent className="space-y-3 p-4">
                <div>
                  <h3 className="font-semibold leading-snug">{recipe.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    System · {recipe.publishStatus ?? 'published'} · {formatDate(recipe.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{recipe.cuisine}</Badge>
                  <Badge variant="outline">{recipe.category}</Badge>
                  {recipe.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function RecipeDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsyncData(() => getRecipe(id), [id])
  const [deleting, setDeleting] = useState(false)
  const capability = writeCapability('recipes', isMockMode())

  async function onDelete() {
    if (!capability.canWrite) return
    if (!id || !window.confirm('Delete this recipe from the admin catalog?')) {
      return
    }
    setDeleting(true)
    try {
      await deleteRecipe(id)
      navigate('/content/recipes')
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <LoadingBlock label="Loading recipe…" />
  if (error || !data) {
    return (
      <div>
        <ErrorState
          title="Recipe not found"
          description={error ?? 'Missing recipe payload.'}
          onRetry={reload}
        />
        <div className="mt-3 flex justify-center">
          <Button variant="outline" onClick={() => navigate('/content/recipes')}>
            Back to System Recipe Library
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/content/recipes">
            <ArrowLeft />
            System Recipe Library
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="overflow-hidden rounded-xl border bg-card">
          {data.coverUrl ? (
            <img src={data.coverUrl} alt={data.title} className="aspect-[16/10] w-full object-cover" />
          ) : (
            <div className="aspect-[16/10] w-full bg-muted" />
          )}
          <div className="space-y-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{data.title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  System · {data.publishStatus ?? 'published'} · {formatDate(data.createdAt)}
                </p>
              </div>
              {capability.canWrite ? (
                <Button variant="destructive" size="sm" loading={deleting} onClick={onDelete}>
                  <Trash2 />
                  Delete
                </Button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge>{data.cuisine}</Badge>
              <Badge variant="secondary">{data.category}</Badge>
              {data.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-5">
            <Tabs defaultValue="ingredients">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                <TabsTrigger value="steps">Steps</TabsTrigger>
                <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              <TabsContent value="ingredients" className="space-y-2">
                {data.ingredients.map((item) => (
                  <div key={item.name} className="flex justify-between border-b py-2 text-sm last:border-0">
                    <span>{item.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="steps" className="space-y-3">
                {data.steps.map((step) => (
                  <div key={step.order} className="flex gap-3 text-sm">
                    <span className="font-mono text-xs text-primary">{String(step.order).padStart(2, '0')}</span>
                    <p>{step.instruction}</p>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="nutrition">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Calories</dt>
                    <dd className="font-semibold tabular-nums">{data.nutrition.calories}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Protein</dt>
                    <dd className="font-semibold tabular-nums">{data.nutrition.proteinG} g</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Carbs</dt>
                    <dd className="font-semibold tabular-nums">{data.nutrition.carbsG} g</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Fat</dt>
                    <dd className="font-semibold tabular-nums">{data.nutrition.fatG} g</dd>
                  </div>
                </dl>
              </TabsContent>
              <TabsContent value="notes">
                <p className="text-sm text-muted-foreground">{data.notes}</p>
                <Button className="mt-4" variant="outline" size="sm" onClick={reload}>
                  Reload detail
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

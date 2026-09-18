import { IngredientsPage } from '@/pages/ingredients/ingredients-page'
import { CategoriesPage } from '@/pages/categories/categories-page'
import { PageHeader } from '@/components/ui/page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

/** Content & AI → Taxonomy (Ingredients + Categories moved from top-level nav). */
export function TaxonomyPage() {
  return (
    <div>
      <PageHeader
        title="Taxonomy"
        description="Platform taxonomy for System Recommended Recipes — Ingredients and Categories (Cuisine / Tags managed under Categories)."
      />
      <Tabs defaultValue="ingredients">
        <TabsList>
          <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        <TabsContent value="ingredients" className="mt-4">
          <IngredientsPage embedded />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <CategoriesPage embedded />
        </TabsContent>
      </Tabs>
    </div>
  )
}

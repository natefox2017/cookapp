import { SubscriptionPage } from '@/pages/subscription/subscription-page'

/** Products & Plans — plan catalog tab from the existing subscription module. */
export function ProductsPage() {
  return (
    <SubscriptionPage
      title="Products & Plans"
      initialTab="plans"
    />
  )
}

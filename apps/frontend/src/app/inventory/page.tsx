import { InventoryService } from '@/services/inventory.service'
import { InventoryClient } from './client'

export const metadata = {
  title: 'Inventory | ERP',
  description: 'Manage warehouse stock and products',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
  }>
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  
  const page = Number(resolvedParams.page) || 1
  const search = resolvedParams.search || ''

  const { data: inventory, count } = await InventoryService.getInventory({
    page,
    limit: 10,
    search
  })

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
          <p className="text-sm text-muted-foreground">
            Manage your products, variants, and current warehouse stock. ({count} total)
          </p>
        </div>
      </div>

      <InventoryClient initialData={inventory} totalCount={count} />
    </div>
  )
}

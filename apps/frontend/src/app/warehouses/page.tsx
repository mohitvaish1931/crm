import { WarehouseService } from '@/services/warehouse.service'
import { WarehousesClient } from './client'

export const metadata = {
  title: 'Warehouses | ERP',
  description: 'Manage warehouse locations and topology',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
  }>
}

export default async function WarehousesPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  
  const page = Number(resolvedParams.page) || 1
  const search = resolvedParams.search || ''

  const { data: warehouses, count } = await WarehouseService.getWarehouses({
    page,
    limit: 10,
    search
  })

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Warehouses</h2>
          <p className="text-sm text-muted-foreground">
            Manage your branches, warehouses, and storage locations. ({count} total)
          </p>
        </div>
      </div>

      <WarehousesClient initialData={warehouses} totalCount={count} />
    </div>
  )
}

import { SupplierService } from '@/services/supplier.service'
import { SuppliersClient } from './client'

export const metadata = {
  title: 'Suppliers | ERP',
  description: 'Manage procurement and suppliers',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
  }>
}

export default async function SuppliersPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  
  const page = Number(resolvedParams.page) || 1
  const search = resolvedParams.search || ''

  const { data: suppliers, count } = await SupplierService.getSuppliers({
    page,
    limit: 10,
    search
  })

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Suppliers</h2>
          <p className="text-sm text-muted-foreground">
            Manage your supply chain partners and vendors. ({count} total)
          </p>
        </div>
      </div>

      <SuppliersClient initialData={suppliers} totalCount={count} />
    </div>
  )
}

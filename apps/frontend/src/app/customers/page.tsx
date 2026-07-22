import { CustomerService } from '@/services/customer.service'
import { CustomersClient } from './client'

export const metadata = {
  title: 'Customers | ERP',
  description: 'Manage customers and their credit accounts',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
  }>
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  
  const page = Number(resolvedParams.page) || 1
  const search = resolvedParams.search || ''
  const status = resolvedParams.status || ''

  // 1. Fetch data from the Service layer (Server-Side)
  // The service handles connection to the repository which calls Supabase securely.
  const { data: customers, count } = await CustomerService.getCustomers({
    page,
    limit: 10,
    search,
    status
  })

  // 2. Pass data to the interactive Client Component
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-sm text-muted-foreground">
            Manage your B2B and Retail customers. ({count} total)
          </p>
        </div>
      </div>

      <CustomersClient initialData={customers} totalCount={count} />
    </div>
  )
}

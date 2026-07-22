import { OrderService } from '@/services/order.service'
import { OrdersClient } from './client'

export const metadata = {
  title: 'Orders | ERP',
  description: 'Manage sales orders and fulfillment',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
  }>
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  
  const page = Number(resolvedParams.page) || 1
  const search = resolvedParams.search || ''
  const status = resolvedParams.status || ''

  const { data: orders, count } = await OrderService.getOrders({
    page,
    limit: 10,
    search,
    status
  })

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sales Orders</h2>
          <p className="text-sm text-muted-foreground">
            Manage your sales orders, fulfillment, and tracking. ({count} total)
          </p>
        </div>
      </div>

      <OrdersClient initialData={orders} totalCount={count} />
    </div>
  )
}

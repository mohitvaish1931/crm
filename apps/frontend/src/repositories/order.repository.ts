import { SupabaseClient } from '@supabase/supabase-js'
import { Order } from '@/types/order'

export class OrderRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(params: {
    page?: number
    limit?: number
    search?: string
    status?: string
  }): Promise<{ data: Order[]; count: number }> {
    const { page = 1, limit = 10, search, status } = params
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = this.supabase
      .from('sales_orders')
      .select('*, customer:customers(name, code)', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (search) {
      query = query.ilike('order_number', `%${search}%`)
    }
    if (status) {
      query = query.eq('status', status)
    }

    query = query.range(from, to)

    const { data, count, error } = await query

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`)
    }

    return {
      data: data as Order[],
      count: count ?? 0,
    }
  }

  async findById(id: string): Promise<Order | null> {
    const { data, error } = await this.supabase
      .from('sales_orders')
      .select('*, customer:customers(name, code)')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to fetch order: ${error.message}`)
    }

    return data as Order
  }
}

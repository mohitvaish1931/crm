import { SupabaseClient } from '@supabase/supabase-js'
import { Warehouse } from '@/types/warehouse'

export class WarehouseRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(params: {
    page?: number
    limit?: number
    search?: string
  }): Promise<{ data: Warehouse[]; count: number }> {
    const { page = 1, limit = 10, search } = params
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = this.supabase
      .from('warehouses')
      .select('*, branch:branches(name)', { count: 'exact' })
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    query = query.range(from, to)

    const { data, count, error } = await query

    if (error) {
      throw new Error(`Failed to fetch warehouses: ${error.message}`)
    }

    return {
      data: data as Warehouse[],
      count: count ?? 0,
    }
  }
}

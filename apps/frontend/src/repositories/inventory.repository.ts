import { SupabaseClient } from '@supabase/supabase-js'
import { InventoryItem } from '@/types/inventory'

export class InventoryRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(params: {
    page?: number
    limit?: number
    search?: string
  }): Promise<{ data: InventoryItem[]; count: number }> {
    const { page = 1, limit = 10, search } = params
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = this.supabase
      .from('product_variants')
      .select(`
        *, 
        product:products(name, type, category:categories(name)),
        current_stocks(available_qty, warehouse:warehouses(name))
      `, { count: 'exact' })
      .order('sku', { ascending: true })

    if (search) {
      query = query.ilike('sku', `%${search}%`)
    }

    query = query.range(from, to)

    const { data, count, error } = await query

    if (error) {
      throw new Error(`Failed to fetch inventory: ${error.message}`)
    }

    return {
      data: data as unknown as InventoryItem[],
      count: count ?? 0,
    }
  }
}

import { SupabaseClient } from '@supabase/supabase-js'
import { Supplier } from '@/types/supplier'

export class SupplierRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(params: {
    page?: number
    limit?: number
    search?: string
  }): Promise<{ data: Supplier[]; count: number }> {
    const { page = 1, limit = 10, search } = params
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = this.supabase
      .from('suppliers')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    query = query.range(from, to)

    const { data, count, error } = await query

    if (error) {
      throw new Error(`Failed to fetch suppliers: ${error.message}`)
    }

    return {
      data: data as Supplier[],
      count: count ?? 0,
    }
  }
}

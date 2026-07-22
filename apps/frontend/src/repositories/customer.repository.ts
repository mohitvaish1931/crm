import { SupabaseClient } from '@supabase/supabase-js'
import { Customer } from '@/types/customer'

export class CustomerRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(params: {
    page?: number
    limit?: number
    search?: string
    status?: string
  }): Promise<{ data: Customer[]; count: number }> {
    const { page = 1, limit = 10, search, status } = params
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = this.supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }
    if (status) {
      query = query.eq('status', status)
    }

    query = query.range(from, to)

    const { data, count, error } = await query

    if (error) {
      throw new Error(`Failed to fetch customers: ${error.message}`)
    }

    return {
      data: data as Customer[],
      count: count ?? 0,
    }
  }

  async findById(id: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to fetch customer: ${error.message}`)
    }

    return data as Customer
  }
}

import { createClient } from '@/lib/server'
import { WarehouseRepository } from '@/repositories/warehouse.repository'

export class WarehouseService {
  static async getWarehouses(params: {
    page?: number
    limit?: number
    search?: string
  }) {
    const supabase = await createClient()
    const repo = new WarehouseRepository(supabase)
    
    // RBAC: Check 'Warehouses.Read'
    
    return await repo.findAll(params)
  }
}

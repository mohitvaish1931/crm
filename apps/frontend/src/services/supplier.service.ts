import { createClient } from '@/lib/server'
import { SupplierRepository } from '@/repositories/supplier.repository'

export class SupplierService {
  static async getSuppliers(params: {
    page?: number
    limit?: number
    search?: string
  }) {
    const supabase = await createClient()
    const repo = new SupplierRepository(supabase)
    
    // RBAC: Check 'Suppliers.Read'
    
    return await repo.findAll(params)
  }
}

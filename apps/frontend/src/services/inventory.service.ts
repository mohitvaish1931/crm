import { createClient } from '@/lib/server'
import { InventoryRepository } from '@/repositories/inventory.repository'

export class InventoryService {
  static async getInventory(params: {
    page?: number
    limit?: number
    search?: string
  }) {
    const supabase = await createClient()
    const repo = new InventoryRepository(supabase)
    
    // RBAC: Check 'Inventory.Read'
    
    return await repo.findAll(params)
  }
}

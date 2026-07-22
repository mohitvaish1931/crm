import { createClient } from '@/lib/server'
import { OrderRepository } from '@/repositories/order.repository'

export class OrderService {
  static async getOrders(params: {
    page?: number
    limit?: number
    search?: string
    status?: string
  }) {
    const supabase = await createClient()
    const repo = new OrderRepository(supabase)
    
    // RBAC: Here we could check if the user has 'Orders.Read' permission
    
    return await repo.findAll(params)
  }

  static async getOrderById(id: string) {
    const supabase = await createClient()
    const repo = new OrderRepository(supabase)
    return await repo.findById(id)
  }
}

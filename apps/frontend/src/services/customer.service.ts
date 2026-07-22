import { createClient } from '@/lib/server'
import { CustomerRepository } from '@/repositories/customer.repository'

export class CustomerService {
  /**
   * Fetch a paginated list of customers.
   * This is where we would also check permissions (e.g. Can the user read customers?)
   */
  static async getCustomers(params: {
    page?: number
    limit?: number
    search?: string
    status?: string
  }) {
    // 1. Initialize Supabase Client
    const supabase = await createClient()

    // 2. Instantiate Repository
    const repo = new CustomerRepository(supabase)

    // 3. (Optional) Check Permissions here using another Service or AuthContext
    // e.g., await PermissionService.check('Customers.Read')

    // 4. Fetch Data
    return await repo.findAll(params)
  }

  /**
   * Fetch a single customer by ID
   */
  static async getCustomerById(id: string) {
    const supabase = await createClient()
    const repo = new CustomerRepository(supabase)
    return await repo.findById(id)
  }
}

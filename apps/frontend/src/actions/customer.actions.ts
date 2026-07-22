'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/server'
import { customerSchema, CustomerFormValues } from '@/schemas/customer.schema'

export async function createCustomerAction(data: CustomerFormValues) {
  // 1. Validate on Server
  const validated = customerSchema.safeParse(data)
  if (!validated.success) {
    return { error: 'Validation failed', issues: validated.error.issues }
  }

  try {
    const supabase = await createClient()

    // Note: We don't have the full service mutation setup yet, 
    // but doing it directly via supabase client for demonstration
    const { error } = await supabase.from('customers').insert({
      ...validated.data,
      // tenant_id: '...' // We will inject this via Auth Context in the real app
    })

    if (error) throw error

    // Revalidate the cache for the customers page
    revalidatePath('/customers')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to create customer:', error)
    return { error: error.message || 'Failed to create customer' }
  }
}

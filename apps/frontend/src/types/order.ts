export interface Order {
  id: string
  tenant_id: string
  order_number: string
  customer_id: string
  status: string // DRAFT, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
  total_amount: number
  expected_delivery: string | null
  created_at: string
  updated_at: string
  
  // Relations
  customer?: {
    name: string
    code: string
  }
}

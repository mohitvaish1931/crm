export interface Customer {
  id: string
  tenant_id: string
  code: string
  name: string
  email: string | null
  phone: string | null
  type: string // e.g. RETAIL, WHOLESALE
  status: string // e.g. ACTIVE, INACTIVE
  credit_limit: number
  outstanding_balance: number
  created_at: string
  updated_at: string
}

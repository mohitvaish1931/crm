export interface Supplier {
  id: string
  tenant_id: string
  code: string
  name: string
  gst: string | null
  pan: string | null
  credit_days: number
  status: string // ACTIVE, INACTIVE, BLACKLISTED
  created_at: string
  updated_at: string
}

export interface Warehouse {
  id: string
  tenant_id: string
  branch_id: string
  name: string
  is_default: boolean
  created_at: string
  updated_at: string
  
  // Relations
  branch?: {
    name: string
  }
}

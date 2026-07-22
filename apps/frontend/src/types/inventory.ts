export interface InventoryItem {
  id: string
  tenant_id: string
  product_id: string
  sku: string
  price: number
  cost: number
  is_active: boolean
  
  // Relations
  product?: {
    name: string
    type: string
    category: { name: string }
  }
  current_stocks?: {
    available_qty: number
    warehouse: { name: string }
  }[]
}

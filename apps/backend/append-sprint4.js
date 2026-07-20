const fs = require('fs');
const content = `
// ==========================================
// SPRINT 4: PROCUREMENT & GOODS RECEIPT ENGINE
// ==========================================

// --- SUPPLIER MANAGEMENT ---

model Supplier {
  id               String    @id @db.Uuid
  tenantId         String    @map("tenant_id") @db.Uuid
  code             String    @db.VarChar(50)
  name             String    @db.VarChar(255)
  gst              String?   @db.VarChar(50)
  pan              String?   @db.VarChar(50)
  creditDays       Int       @default(0) @map("credit_days")
  paymentTerms     String?   @map("payment_terms") @db.VarChar(255)
  status           String    @default("ACTIVE") @db.VarChar(20) // ACTIVE, INACTIVE, BLACKLISTED
  
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")
  deletedAt        DateTime? @map("deleted_at")

  tenant           Tenant    @relation(fields: [tenantId], references: [id])
  contacts         SupplierContact[]
  addresses        SupplierAddress[]
  performance      SupplierPerformance?
  priceHistory     ProductSupplierPriceHistory[]
  purchaseOrders   PurchaseOrder[]
  goodsReceipts    GoodsReceipt[]
  returns          PurchaseReturn[]

  @@unique([tenantId, code])
  @@map("suppliers")
}

model SupplierContact {
  id         String   @id @db.Uuid
  supplierId String   @map("supplier_id") @db.Uuid
  name       String   @db.VarChar(255)
  phone      String?  @db.VarChar(50)
  email      String?  @db.VarChar(255)
  isPrimary  Boolean  @default(false) @map("is_primary")

  supplier   Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)

  @@map("supplier_contacts")
}

model SupplierAddress {
  id         String   @id @db.Uuid
  supplierId String   @map("supplier_id") @db.Uuid
  type       String   @default("BILLING") @db.VarChar(50) // BILLING, SHIPPING
  address    String   @db.Text
  city       String   @db.VarChar(100)
  state      String   @db.VarChar(100)
  pincode    String   @db.VarChar(20)
  country    String   @default("India") @db.VarChar(100)
  isPrimary  Boolean  @default(false) @map("is_primary")

  supplier   Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)

  @@map("supplier_addresses")
}

model SupplierPerformance {
  supplierId        String   @id @map("supplier_id") @db.Uuid
  tenantId          String   @map("tenant_id") @db.Uuid
  onTimeDeliveryPct Decimal  @default(100.0) @map("on_time_delivery_pct") @db.Decimal(5, 2)
  avgDelayDays      Decimal  @default(0.0) @map("avg_delay_days") @db.Decimal(5, 2)
  returnPct         Decimal  @default(0.0) @map("return_pct") @db.Decimal(5, 2)
  damagePct         Decimal  @default(0.0) @map("damage_pct") @db.Decimal(5, 2)
  totalPurchaseVal  Decimal  @default(0.0) @map("total_purchase_val") @db.Decimal(15, 2)
  avgLeadTimeDays   Decimal  @default(0.0) @map("avg_lead_time_days") @db.Decimal(5, 2)
  ranking           Int      @default(5)

  updatedAt         DateTime @updatedAt @map("updated_at")

  supplier          Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)

  @@map("supplier_performance")
}

model ProductSupplierPriceHistory {
  id               String   @id @db.Uuid
  tenantId         String   @map("tenant_id") @db.Uuid
  supplierId       String   @map("supplier_id") @db.Uuid
  variantId        String   @map("variant_id") @db.Uuid
  lastPurchasePrice Decimal @default(0.0) @map("last_purchase_price") @db.Decimal(12, 2)
  avgPurchasePrice  Decimal @default(0.0) @map("avg_purchase_price") @db.Decimal(12, 2)
  lowestPrice       Decimal @default(0.0) @map("lowest_price") @db.Decimal(12, 2)
  highestPrice      Decimal @default(0.0) @map("highest_price") @db.Decimal(12, 2)
  lastPurchaseDate  DateTime @map("last_purchase_date")
  
  updatedAt         DateTime @updatedAt @map("updated_at")

  supplier          Supplier       @relation(fields: [supplierId], references: [id])
  variant           ProductVariant @relation(fields: [variantId], references: [id])

  @@unique([supplierId, variantId])
  @@map("product_supplier_price_history")
}

// --- PURCHASE REQUISITION ---

model PurchaseRequisition {
  id          String   @id @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  prNumber    String   @map("pr_number") @db.VarChar(100)
  status      String   @default("DRAFT") @db.VarChar(50) // DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, CONVERTED
  notes       String?  @db.Text
  
  requestedBy String   @map("requested_by") @db.Uuid
  approvedBy  String?  @map("approved_by") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  items       PurchaseRequisitionItem[]

  @@unique([tenantId, prNumber])
  @@map("purchase_requisitions")
}

model PurchaseRequisitionItem {
  id           String   @id @db.Uuid
  prId         String   @map("pr_id") @db.Uuid
  variantId    String   @map("variant_id") @db.Uuid
  uomId        String   @map("uom_id") @db.Uuid
  quantity     Decimal  @db.Decimal(12, 4)
  expectedDate DateTime? @map("expected_date")

  pr           PurchaseRequisition @relation(fields: [prId], references: [id], onDelete: Cascade)
  variant      ProductVariant      @relation(fields: [variantId], references: [id])
  uom          Uom                 @relation(fields: [uomId], references: [id])

  @@map("purchase_requisition_items")
}

// --- PURCHASE ORDER ---

model PurchaseOrder {
  id            String   @id @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  poNumber      String   @map("po_number") @db.VarChar(100)
  supplierId    String   @map("supplier_id") @db.Uuid
  warehouseId   String   @map("warehouse_id") @db.Uuid
  status        String   @default("DRAFT") @db.VarChar(50) // DRAFT, PENDING_APPROVAL, APPROVED, ON_HOLD, PARTIAL_RECEIVED, COMPLETED, CLOSED, CANCELLED, REJECTED
  
  expectedDate  DateTime? @map("expected_date")
  totalAmount   Decimal  @default(0.0) @map("total_amount") @db.Decimal(15, 2)
  notes         String?  @db.Text
  attachmentUrl String?  @map("attachment_url") // Cloudflare R2
  
  createdBy     String   @map("created_by") @db.Uuid
  approvedBy    String?  @map("approved_by") @db.Uuid
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  supplier      Supplier            @relation(fields: [supplierId], references: [id])
  warehouse     Warehouse           @relation(fields: [warehouseId], references: [id])
  items         PurchaseOrderItem[]
  goodsReceipts GoodsReceipt[]

  @@unique([tenantId, poNumber])
  @@map("purchase_orders")
}

model PurchaseOrderItem {
  id          String   @id @db.Uuid
  poId        String   @map("po_id") @db.Uuid
  variantId   String   @map("variant_id") @db.Uuid
  uomId       String   @map("uom_id") @db.Uuid
  quantity    Decimal  @db.Decimal(12, 4)
  receivedQty Decimal  @default(0.0) @map("received_qty") @db.Decimal(12, 4)
  unitPrice   Decimal  @default(0.0) @map("unit_price") @db.Decimal(12, 2)
  taxRate     Decimal  @default(0.0) @map("tax_rate") @db.Decimal(5, 2)
  totalAmount Decimal  @default(0.0) @map("total_amount") @db.Decimal(12, 2)

  po          PurchaseOrder       @relation(fields: [poId], references: [id], onDelete: Cascade)
  variant     ProductVariant      @relation(fields: [variantId], references: [id])
  uom         Uom                 @relation(fields: [uomId], references: [id])
  grnItems    GoodsReceiptItem[]

  @@map("purchase_order_items")
}

// --- GOODS RECEIPT NOTE (GRN) & INSPECTION ---

model GoodsReceipt {
  id              String   @id @db.Uuid
  tenantId        String   @map("tenant_id") @db.Uuid
  grnNumber       String   @map("grn_number") @db.VarChar(100)
  poId            String   @map("po_id") @db.Uuid
  supplierId      String   @map("supplier_id") @db.Uuid
  warehouseId     String   @map("warehouse_id") @db.Uuid
  supplierInvoice String?  @map("supplier_invoice") @db.VarChar(100)
  invoiceHash     String?  @map("invoice_hash") @db.VarChar(255) // For duplicate detection
  attachmentUrl   String?  @map("attachment_url") // Cloudflare R2 LR Copy
  status          String   @default("INSPECTION_PENDING") @db.VarChar(50) // INSPECTION_PENDING, RECEIVED, PARTIAL_RETURNED, CLOSED
  
  receivedDate    DateTime @default(now()) @map("received_date")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  po              PurchaseOrder      @relation(fields: [poId], references: [id])
  supplier        Supplier           @relation(fields: [supplierId], references: [id])
  warehouse       Warehouse          @relation(fields: [warehouseId], references: [id])
  items           GoodsReceiptItem[]
  landedCosts     LandedCostAllocation[]
  returns         PurchaseReturn[]

  @@unique([tenantId, grnNumber])
  @@map("goods_receipts")
}

model GoodsReceiptItem {
  id            String   @id @db.Uuid
  grnId         String   @map("grn_id") @db.Uuid
  poItemId      String   @map("po_item_id") @db.Uuid
  variantId     String   @map("variant_id") @db.Uuid
  binId         String?  @map("bin_id") @db.Uuid
  
  batchNumber   String?  @map("batch_number") @db.VarChar(100)
  dyeLot        String?  @map("dye_lot") @db.VarChar(100)
  
  expectedQty   Decimal  @db.Decimal(12, 4)
  receivedQty   Decimal  @db.Decimal(12, 4) // Total received in this shipment
  acceptedQty   Decimal  @default(0.0) @map("accepted_qty") @db.Decimal(12, 4) // Passed inspection
  rejectedQty   Decimal  @default(0.0) @map("rejected_qty") @db.Decimal(12, 4) // Failed inspection
  
  status        String   @default("PENDING_INSPECTION") @db.VarChar(50)

  grn           GoodsReceipt       @relation(fields: [grnId], references: [id], onDelete: Cascade)
  poItem        PurchaseOrderItem  @relation(fields: [poItemId], references: [id])
  variant       ProductVariant     @relation(fields: [variantId], references: [id])
  bin           Bin?               @relation(fields: [binId], references: [id])
  inspections   QualityInspection[]
  returnItems   PurchaseReturnItem[]

  @@map("goods_receipt_items")
}

model QualityInspection {
  id           String   @id @db.Uuid
  tenantId     String   @map("tenant_id") @db.Uuid
  grnItemId    String   @map("grn_item_id") @db.Uuid
  inspectedQty Decimal  @map("inspected_qty") @db.Decimal(12, 4)
  passedQty    Decimal  @map("passed_qty") @db.Decimal(12, 4)
  failedQty    Decimal  @map("failed_qty") @db.Decimal(12, 4)
  defectReason String?  @map("defect_reason") @db.Text
  inspectedBy  String   @map("inspected_by") @db.Uuid
  createdAt    DateTime @default(now()) @map("created_at")

  grnItem      GoodsReceiptItem @relation(fields: [grnItemId], references: [id], onDelete: Cascade)

  @@map("quality_inspections")
}

// --- PURCHASE RETURNS ---

model PurchaseReturn {
  id            String   @id @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  returnNumber  String   @map("return_number") @db.VarChar(100)
  grnId         String   @map("grn_id") @db.Uuid
  supplierId    String   @map("supplier_id") @db.Uuid
  status        String   @default("DRAFT") @db.VarChar(50) // DRAFT, PENDING_APPROVAL, SHIPPED, COMPLETED
  totalAmount   Decimal  @default(0.0) @map("total_amount") @db.Decimal(15, 2)
  reason        String?  @db.Text
  
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  grn           GoodsReceipt         @relation(fields: [grnId], references: [id])
  supplier      Supplier             @relation(fields: [supplierId], references: [id])
  items         PurchaseReturnItem[]

  @@unique([tenantId, returnNumber])
  @@map("purchase_returns")
}

model PurchaseReturnItem {
  id           String   @id @db.Uuid
  returnId     String   @map("return_id") @db.Uuid
  grnItemId    String   @map("grn_item_id") @db.Uuid
  variantId    String   @map("variant_id") @db.Uuid
  quantity     Decimal  @db.Decimal(12, 4)
  unitPrice    Decimal  @map("unit_price") @db.Decimal(12, 2)
  totalAmount  Decimal  @map("total_amount") @db.Decimal(12, 2)
  reason       String?  @db.VarChar(255)

  returnNote   PurchaseReturn   @relation(fields: [returnId], references: [id], onDelete: Cascade)
  grnItem      GoodsReceiptItem @relation(fields: [grnItemId], references: [id])
  variant      ProductVariant   @relation(fields: [variantId], references: [id])

  @@map("purchase_return_items")
}

// --- LANDED COST ---

model LandedCostAllocation {
  id           String   @id @db.Uuid
  tenantId     String   @map("tenant_id") @db.Uuid
  grnId        String   @map("grn_id") @db.Uuid
  chargeType   String   @map("charge_type") @db.VarChar(100) // TRANSPORT, LOADING, INSURANCE, OTHER
  amount       Decimal  @db.Decimal(12, 2)
  allocationMethod String @default("BY_VALUE") @map("allocation_method") @db.VarChar(50) // BY_VALUE, BY_QUANTITY, BY_WEIGHT, MANUAL
  
  createdAt    DateTime @default(now()) @map("created_at")

  grn          GoodsReceipt @relation(fields: [grnId], references: [id], onDelete: Cascade)

  @@map("landed_cost_allocations")
}
`;
fs.appendFileSync('prisma/schema.prisma', content);

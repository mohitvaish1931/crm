const fs = require('fs');
const content = `
// ==========================================
// SPRINT 5A: SALES ORDER MANAGEMENT
// ==========================================

// --- CUSTOMER MANAGEMENT ---

model Customer {
  id               String    @id @db.Uuid
  tenantId         String    @map("tenant_id") @db.Uuid
  code             String    @db.VarChar(50)
  name             String    @db.VarChar(255)
  gst              String?   @db.VarChar(50)
  pan              String?   @db.VarChar(50)
  status           String    @default("ACTIVE") @db.VarChar(20)
  
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  tenant           Tenant    @relation(fields: [tenantId], references: [id])
  contacts         CustomerContact[]
  addresses        CustomerAddress[]
  credit           CustomerCredit?
  priceHistory     CustomerPriceHistory[]
  pricingRules     CustomerPricingRule[]
  quotations       SalesQuotation[]
  salesOrders      SalesOrder[]

  @@unique([tenantId, code])
  @@map("customers")
}

model CustomerContact {
  id         String   @id @db.Uuid
  customerId String   @map("customer_id") @db.Uuid
  name       String   @db.VarChar(255)
  phone      String?  @db.VarChar(50)
  email      String?  @db.VarChar(255)
  isPrimary  Boolean  @default(false) @map("is_primary")

  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@map("customer_contacts")
}

model CustomerAddress {
  id         String   @id @db.Uuid
  customerId String   @map("customer_id") @db.Uuid
  type       String   @default("BILLING") @db.VarChar(50)
  address    String   @db.Text
  city       String   @db.VarChar(100)
  state      String   @db.VarChar(100)
  pincode    String   @db.VarChar(20)
  isPrimary  Boolean  @default(false) @map("is_primary")

  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@map("customer_addresses")
}

model CustomerCredit {
  customerId       String   @id @map("customer_id") @db.Uuid
  tenantId         String   @map("tenant_id") @db.Uuid
  creditLimit      Decimal  @default(0.0) @map("credit_limit") @db.Decimal(15, 2)
  availableCredit  Decimal  @default(0.0) @map("available_credit") @db.Decimal(15, 2)
  outstanding      Decimal  @default(0.0) @db.Decimal(15, 2)
  status           String   @default("GOOD_STANDING") @db.VarChar(50) // GOOD_STANDING, HOLD
  
  updatedAt        DateTime @updatedAt @map("updated_at")

  customer         Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@map("customer_credits")
}

// --- PRICING & DISCOUNTS ---

model CustomerPriceHistory {
  id               String   @id @db.Uuid
  tenantId         String   @map("tenant_id") @db.Uuid
  customerId       String   @map("customer_id") @db.Uuid
  variantId        String   @map("variant_id") @db.Uuid
  lastSalePrice    Decimal  @default(0.0) @map("last_sale_price") @db.Decimal(12, 2)
  avgSalePrice     Decimal  @default(0.0) @map("avg_sale_price") @db.Decimal(12, 2)
  lowestPrice      Decimal  @default(0.0) @map("lowest_price") @db.Decimal(12, 2)
  highestPrice     Decimal  @default(0.0) @map("highest_price") @db.Decimal(12, 2)
  lastSaleDate     DateTime @map("last_sale_date")
  
  updatedAt        DateTime @updatedAt @map("updated_at")

  customer         Customer       @relation(fields: [customerId], references: [id])
  variant          ProductVariant @relation(fields: [variantId], references: [id])

  @@unique([customerId, variantId])
  @@map("customer_price_history")
}

model CustomerPricingRule {
  id           String   @id @db.Uuid
  tenantId     String   @map("tenant_id") @db.Uuid
  customerId   String   @map("customer_id") @db.Uuid
  variantId    String   @map("variant_id") @db.Uuid
  customPrice  Decimal  @map("custom_price") @db.Decimal(12, 2)

  customer     Customer       @relation(fields: [customerId], references: [id], onDelete: Cascade)
  variant      ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)

  @@unique([customerId, variantId])
  @@map("customer_pricing_rules")
}

model DiscountRule {
  id             String   @id @db.Uuid
  tenantId       String   @map("tenant_id") @db.Uuid
  name           String   @db.VarChar(100)
  type           String   @db.VarChar(50) // CUSTOMER, CATEGORY, PRODUCT, VOLUME, FESTIVAL
  discountPct    Decimal  @map("discount_pct") @db.Decimal(5, 2)
  minQuantity    Int?     @map("min_quantity")
  targetId       String?  @map("target_id") @db.Uuid // ID of category/product/customer based on type
  active         Boolean  @default(true)
  
  @@map("discount_rules")
}

// --- QUOTATIONS ---

model SalesQuotation {
  id             String   @id @db.Uuid
  tenantId       String   @map("tenant_id") @db.Uuid
  quoteNumber    String   @map("quote_number") @db.VarChar(100)
  customerId     String   @map("customer_id") @db.Uuid
  status         String   @default("DRAFT") @db.VarChar(50) // DRAFT, NEGOTIATING, APPROVED, CONVERTED, REJECTED
  totalAmount    Decimal  @default(0.0) @map("total_amount") @db.Decimal(15, 2)
  validUntil     DateTime? @map("valid_until")
  
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  customer       Customer              @relation(fields: [customerId], references: [id])
  items          SalesQuotationItem[]

  @@unique([tenantId, quoteNumber])
  @@map("sales_quotations")
}

model SalesQuotationItem {
  id           String   @id @db.Uuid
  quoteId      String   @map("quote_id") @db.Uuid
  variantId    String   @map("variant_id") @db.Uuid
  uomId        String   @map("uom_id") @db.Uuid
  quantity     Decimal  @db.Decimal(12, 4)
  unitPrice    Decimal  @map("unit_price") @db.Decimal(12, 2)
  discountPct  Decimal  @default(0.0) @map("discount_pct") @db.Decimal(5, 2)
  total        Decimal  @db.Decimal(12, 2)

  quote        SalesQuotation @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  variant      ProductVariant @relation(fields: [variantId], references: [id])
  uom          Uom            @relation(fields: [uomId], references: [id])

  @@map("sales_quotation_items")
}

// --- SALES ORDERS ---

model SalesOrder {
  id               String   @id @db.Uuid
  tenantId         String   @map("tenant_id") @db.Uuid
  orderNumber      String   @map("order_number") @db.VarChar(100)
  customerId       String   @map("customer_id") @db.Uuid
  warehouseId      String   @map("warehouse_id") @db.Uuid
  status           String   @default("DRAFT") @db.VarChar(50) // DRAFT, PENDING_APPROVAL, CREDIT_HOLD, APPROVED, RESERVED, PARTIAL_SHIPPED, COMPLETED, CANCELLED
  orderType        String   @default("CREDIT") @db.VarChar(50) // CASH, CREDIT
  
  totalAmount      Decimal  @default(0.0) @map("total_amount") @db.Decimal(15, 2)
  expectedDispatch DateTime? @map("expected_dispatch")
  
  createdBy        String   @map("created_by") @db.Uuid
  approvedBy       String?  @map("approved_by") @db.Uuid
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  customer         Customer         @relation(fields: [customerId], references: [id])
  warehouse        Warehouse        @relation(fields: [warehouseId], references: [id])
  items            SalesOrderItem[]

  @@unique([tenantId, orderNumber])
  @@map("sales_orders")
}

model SalesOrderItem {
  id             String   @id @db.Uuid
  orderId        String   @map("order_id") @db.Uuid
  variantId      String   @map("variant_id") @db.Uuid
  uomId          String   @map("uom_id") @db.Uuid
  
  quantity       Decimal  @db.Decimal(12, 4)
  reservedQty    Decimal  @default(0.0) @map("reserved_qty") @db.Decimal(12, 4)
  backorderQty   Decimal  @default(0.0) @map("backorder_qty") @db.Decimal(12, 4)
  shippedQty     Decimal  @default(0.0) @map("shipped_qty") @db.Decimal(12, 4)
  
  unitPrice      Decimal  @map("unit_price") @db.Decimal(12, 2)
  discountPct    Decimal  @default(0.0) @map("discount_pct") @db.Decimal(5, 2)
  totalAmount    Decimal  @map("total_amount") @db.Decimal(12, 2)

  order          SalesOrder     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  variant        ProductVariant @relation(fields: [variantId], references: [id])
  uom            Uom            @relation(fields: [uomId], references: [id])

  @@map("sales_order_items")
}
`;
fs.appendFileSync('prisma/schema.prisma', content);

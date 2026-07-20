const fs = require('fs');
const path = require('path');
const schemaPath = path.join('apps', 'backend', 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

const newModels = `
// ==========================================
// SPRINT 3: INVENTORY FOUNDATION & PRODUCTS
// ==========================================

// --- WAREHOUSE TOPOLOGY ---

model Zone {
  id         String    @id @db.Uuid
  tenantId   String    @map("tenant_id") @db.Uuid
  warehouseId String   @map("warehouse_id") @db.Uuid
  name       String    @db.VarChar(100)
  type       String    @default("STORAGE") @db.VarChar(50) // STORAGE, RECEIVING, DISPATCH, QUARANTINE
  isActive   Boolean   @default(true) @map("is_active")

  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")

  tenant    Tenant    @relation(fields: [tenantId], references: [id])
  warehouse Warehouse @relation(fields: [warehouseId], references: [id])
  racks      Rack[]

  @@unique([warehouseId, name])
  @@map("zones")
}

model Rack {
  id         String    @id @db.Uuid
  tenantId   String    @map("tenant_id") @db.Uuid
  zoneId     String    @map("zone_id") @db.Uuid
  name       String    @db.VarChar(100)
  
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")

  zone       Zone      @relation(fields: [zoneId], references: [id])
  bins       Bin[]

  @@unique([zoneId, name])
  @@map("racks")
}

model Bin {
  id         String    @id @db.Uuid
  tenantId   String    @map("tenant_id") @db.Uuid
  rackId     String    @map("rack_id") @db.Uuid
  name       String    @db.VarChar(100)
  barcode    String?   @unique @db.VarChar(100)
  
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")

  rack       Rack      @relation(fields: [rackId], references: [id])
  currentStocks CurrentStock[]

  @@unique([rackId, name])
  @@map("bins")
}

// --- UNITS OF MEASURE (UOM) ---

model Uom {
  id            String    @id @db.Uuid
  tenantId      String    @map("tenant_id") @db.Uuid
  code          String    @db.VarChar(20) // PCS, MTR, ROLL, BNDL
  name          String    @db.VarChar(100)
  isFractional  Boolean   @default(false) @map("is_fractional") // true for MTR, false for PCS
  
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  baseFor       UomConversion[] @relation("BaseUom")
  targetFor     UomConversion[] @relation("TargetUom")
  products      Product[]

  @@unique([tenantId, code])
  @@map("uoms")
}

model UomConversion {
  id          String   @id @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  baseUomId   String   @map("base_uom_id") @db.Uuid
  targetUomId String   @map("target_uom_id") @db.Uuid
  multiplier  Decimal  @db.Decimal(10, 4) // e.g. 1 DOZEN = 12 PCS

  baseUom     Uom      @relation("BaseUom", fields: [baseUomId], references: [id])
  targetUom   Uom      @relation("TargetUom", fields: [targetUomId], references: [id])

  @@unique([baseUomId, targetUomId])
  @@map("uom_conversions")
}

// --- CLASSIFICATION ---

model Category {
  id          String    @id @db.Uuid
  tenantId    String    @map("tenant_id") @db.Uuid
  parentId    String?   @map("parent_id") @db.Uuid
  name        String    @db.VarChar(100)
  slug        String    @db.VarChar(100)
  
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  parent      Category?  @relation("CategoryToCategory", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryToCategory")
  products    Product[]

  @@unique([tenantId, slug])
  @@map("categories")
}

model Brand {
  id          String    @id @db.Uuid
  tenantId    String    @map("tenant_id") @db.Uuid
  name        String    @db.VarChar(100)
  
  products    Product[]
  
  @@unique([tenantId, name])
  @@map("brands")
}

model Collection {
  id          String    @id @db.Uuid
  tenantId    String    @map("tenant_id") @db.Uuid
  name        String    @db.VarChar(100)
  
  products    Product[]
  
  @@unique([tenantId, name])
  @@map("collections")
}

// --- ATTRIBUTES & VARIANT ENGINE ---

model Attribute {
  id          String    @id @db.Uuid
  tenantId    String    @map("tenant_id") @db.Uuid
  name        String    @db.VarChar(100) // e.g. "Color", "Size", "Fabric"
  type        String    @default("TEXT") @db.VarChar(50) // TEXT, COLOR_HEX, NUMBER
  
  values      AttributeValue[]

  @@unique([tenantId, name])
  @@map("attributes")
}

model AttributeValue {
  id          String    @id @db.Uuid
  tenantId    String    @map("tenant_id") @db.Uuid
  attributeId String    @map("attribute_id") @db.Uuid
  value       String    @db.VarChar(100)
  meta        String?   @db.VarChar(100) // e.g. #FF0000 for color

  attribute   Attribute @relation(fields: [attributeId], references: [id])
  variantMappings VariantAttribute[]

  @@unique([attributeId, value])
  @@map("attribute_values")
}

// --- PRODUCTS ---

model Product {
  id          String    @id @db.Uuid
  tenantId    String    @map("tenant_id") @db.Uuid
  type        String    @default("STANDARD") @db.VarChar(50) // STANDARD, FABRIC_ROLL, SAREE, BUNDLE
  name        String    @db.VarChar(255)
  description String?   @db.Text
  categoryId  String    @map("category_id") @db.Uuid
  brandId     String?   @map("brand_id") @db.Uuid
  collectionId String?  @map("collection_id") @db.Uuid
  uomId       String    @map("uom_id") @db.Uuid
  
  // Base SKU for non-variant products or prefix for variants
  baseSku     String    @map("base_sku") @db.VarChar(100)
  hasVariants Boolean   @default(false) @map("has_variants")

  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  category    Category  @relation(fields: [categoryId], references: [id])
  brand       Brand?    @relation(fields: [brandId], references: [id])
  collection  Collection? @relation(fields: [collectionId], references: [id])
  uom         Uom       @relation(fields: [uomId], references: [id])
  variants    ProductVariant[]

  @@unique([tenantId, baseSku])
  @@map("products")
}

model ProductVariant {
  id          String    @id @db.Uuid
  tenantId    String    @map("tenant_id") @db.Uuid
  productId   String    @map("product_id") @db.Uuid
  sku         String    @unique @db.VarChar(100)
  barcode     String?   @unique @db.VarChar(100)
  price       Decimal   @default(0.00) @db.Decimal(12, 2)
  cost        Decimal   @default(0.00) @db.Decimal(12, 2)
  
  isActive    Boolean   @default(true) @map("is_active")

  product     Product   @relation(fields: [productId], references: [id])
  attributes  VariantAttribute[]
  stockLedger StockLedger[]
  currentStock CurrentStock[]
  fabricRolls FabricRoll[]

  @@map("product_variants")
}

model VariantAttribute {
  variantId         String @map("variant_id") @db.Uuid
  attributeValueId  String @map("attribute_value_id") @db.Uuid

  variant           ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  attributeValue    AttributeValue @relation(fields: [attributeValueId], references: [id], onDelete: Cascade)

  @@id([variantId, attributeValueId])
  @@map("variant_attributes")
}

// --- TEXTILE SPECIFIC: FABRIC ROLLS ---

model FabricRoll {
  id              String    @id @db.Uuid
  tenantId        String    @map("tenant_id") @db.Uuid
  variantId       String    @map("variant_id") @db.Uuid
  rollNumber      String    @unique @map("roll_number") @db.VarChar(100)
  originalLength  Decimal   @db.Decimal(10, 4)
  remainingLength Decimal   @db.Decimal(10, 4)
  dyeLot          String?   @map("dye_lot") @db.VarChar(50)
  
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  variant         ProductVariant @relation(fields: [variantId], references: [id])

  @@map("fabric_rolls")
}

// --- INVENTORY ENGINE ---

model StockLedger {
  id            String    @id @db.Uuid
  tenantId      String    @map("tenant_id") @db.Uuid
  variantId     String    @map("variant_id") @db.Uuid
  warehouseId   String    @map("warehouse_id") @db.Uuid
  binId         String?   @map("bin_id") @db.Uuid
  
  type          String    @db.VarChar(50) // IN, OUT, ADJUSTMENT, TRANSFER
  quantity      Decimal   @db.Decimal(12, 4)
  balance       Decimal   @db.Decimal(12, 4) // Running balance AFTER transaction
  referenceType String    @map("reference_type") @db.VarChar(50) // PURCHASE_ORDER, SALES_INVOICE, MANUAL
  referenceId   String    @map("reference_id") @db.Uuid
  
  createdBy     String    @map("created_by") @db.Uuid
  createdAt     DateTime  @default(now()) @map("created_at")

  variant       ProductVariant @relation(fields: [variantId], references: [id])
  warehouse     Warehouse      @relation(fields: [warehouseId], references: [id])

  @@index([variantId, warehouseId])
  @@map("stock_ledgers")
}

model CurrentStock {
  id            String    @id @db.Uuid
  tenantId      String    @map("tenant_id") @db.Uuid
  variantId     String    @map("variant_id") @db.Uuid
  warehouseId   String    @map("warehouse_id") @db.Uuid
  binId         String?   @map("bin_id") @db.Uuid
  
  availableQty  Decimal   @default(0) @map("available_qty") @db.Decimal(12, 4)
  reservedQty   Decimal   @default(0) @map("reserved_qty") @db.Decimal(12, 4)
  damagedQty    Decimal   @default(0) @map("damaged_qty") @db.Decimal(12, 4)
  
  updatedAt     DateTime  @updatedAt @map("updated_at")

  variant       ProductVariant @relation(fields: [variantId], references: [id])
  warehouse     Warehouse      @relation(fields: [warehouseId], references: [id])
  bin           Bin?           @relation(fields: [binId], references: [id])

  @@unique([variantId, warehouseId, binId])
  @@map("current_stocks")
}

`;

content += newModels;
fs.writeFileSync(schemaPath, content);
console.log('Appended Sprint 3 schema models');

const fs = require('fs');

const content = `
// ==========================================
// SPRINT 5B: FULFILLMENT & SHIPPING
// ==========================================

// --- TRANSPORTER MASTER ---
model Transporter {
  id               String   @id @db.Uuid
  tenantId         String   @map("tenant_id") @db.Uuid
  name             String   @db.VarChar(255)
  lrPrefix         String?  @map("lr_prefix") @db.VarChar(50)
  contactName      String?  @map("contact_name") @db.VarChar(255)
  phone            String?  @db.VarChar(50)
  serviceAreas     Json?    @map("service_areas") // Array of states/cities
  status           String   @default("ACTIVE") @db.VarChar(50)

  shipments        Shipment[]

  @@unique([tenantId, name])
  @@map("transporters")
}

// --- FULFILLMENT AUDIT & SNAPSHOT ---
model FulfillmentAuditLog {
  id               String   @id @db.Uuid
  tenantId         String   @map("tenant_id") @db.Uuid
  action           String   @db.VarChar(100) // PICK_STARTED, PACKED, DISPATCHED, HELD, etc.
  referenceType    String   @map("reference_type") @db.VarChar(50) // SALES_ORDER, SHIPMENT
  referenceId      String   @map("reference_id") @db.Uuid
  userId           String   @map("user_id") @db.Uuid
  warehouseId      String?  @map("warehouse_id") @db.Uuid
  deviceIp         String?  @map("device_ip") @db.VarChar(50)
  timestamp        DateTime @default(now())
  details          Json?

  @@map("fulfillment_audit_logs")
}

model InventorySnapshot {
  id               String   @id @db.Uuid
  tenantId         String   @map("tenant_id") @db.Uuid
  shipmentId       String   @map("shipment_id") @db.Uuid
  warehouseId      String   @map("warehouse_id") @db.Uuid
  binId            String   @map("bin_id") @db.Uuid
  variantId        String   @map("variant_id") @db.Uuid
  dyeLot           String?  @map("dye_lot") @db.VarChar(100)
  batchNumber      String?  @map("batch_number") @db.VarChar(100)
  serial           String?  @db.VarChar(100)
  reservedQty      Decimal  @map("reserved_qty") @db.Decimal(15, 2)
  dispatchedQty    Decimal  @map("dispatched_qty") @db.Decimal(15, 2)
  timestamp        DateTime @default(now())

  shipment         Shipment @relation(fields: [shipmentId], references: [id])

  @@map("inventory_snapshots")
}

// --- PICK & PACK ---
model PickList {
  id               String   @id @db.Uuid
  tenantId         String   @map("tenant_id") @db.Uuid
  orderId          String   @map("order_id") @db.Uuid
  status           String   @default("PENDING") @db.VarChar(50) // PENDING, PICKING, COMPLETED
  assignedTo       String?  @map("assigned_to") @db.Uuid
  
  order            SalesOrder     @relation(fields: [orderId], references: [id])
  items            PickListItem[]

  @@map("pick_lists")
}

model PickListItem {
  id               String   @id @db.Uuid
  pickListId       String   @map("pick_list_id") @db.Uuid
  orderItemId      String   @map("order_item_id") @db.Uuid
  variantId        String   @map("variant_id") @db.Uuid
  binId            String   @map("bin_id") @db.Uuid
  expectedQty      Decimal  @map("expected_qty") @db.Decimal(15, 2)
  pickedQty        Decimal  @default(0.0) @map("picked_qty") @db.Decimal(15, 2)
  shortPickQty     Decimal  @default(0.0) @map("short_pick_qty") @db.Decimal(15, 2)
  shortPickReason  String?  @map("short_pick_reason") @db.VarChar(255)

  pickList         PickList       @relation(fields: [pickListId], references: [id])
  orderItem        SalesOrderItem @relation(fields: [orderItemId], references: [id])
  bin              Bin            @relation(fields: [binId], references: [id])

  @@map("pick_list_items")
}

model PackingSlip {
  id               String   @id @db.Uuid
  tenantId         String   @map("tenant_id") @db.Uuid
  orderId          String   @map("order_id") @db.Uuid
  status           String   @default("PACKING") @db.VarChar(50) // PACKING, VERIFIED, READY_TO_SHIP
  
  order            SalesOrder @relation(fields: [orderId], references: [id])
  boxes            PackingBox[]
  shipments        Shipment[]

  @@map("packing_slips")
}

model PackingBox {
  id               String   @id @db.Uuid
  packingSlipId    String   @map("packing_slip_id") @db.Uuid
  boxNumber        String   @map("box_number") @db.VarChar(50)
  trackingLabel    String?  @map("tracking_label") @db.VarChar(100)
  items            Json     // Array of { orderItemId, pickedQty }

  packingSlip      PackingSlip @relation(fields: [packingSlipId], references: [id])

  @@map("packing_boxes")
}

// --- SHIPMENT ---
model Shipment {
  id               String   @id @db.Uuid
  tenantId         String   @map("tenant_id") @db.Uuid
  orderId          String   @map("order_id") @db.Uuid
  packingSlipId    String   @map("packing_slip_id") @db.Uuid
  transporterId    String?  @map("transporter_id") @db.Uuid
  status           String   @default("READY") @db.VarChar(50) // READY, ON_HOLD, DISPATCHED, OUT_FOR_DELIVERY, DELIVERED, POD_UPLOADED, COMPLETED
  
  lrNumber         String?  @map("lr_number") @db.VarChar(100)
  carrierTrackingId String? @map("carrier_tracking_id") @db.VarChar(100) // Webhook Ready
  podUrl           String?  @map("pod_url") @db.Text
  
  dispatchedAt     DateTime? @map("dispatched_at")
  deliveredAt      DateTime? @map("delivered_at")

  order            SalesOrder          @relation(fields: [orderId], references: [id])
  packingSlip      PackingSlip         @relation(fields: [packingSlipId], references: [id])
  transporter      Transporter?        @relation(fields: [transporterId], references: [id])
  items            ShipmentItem[]
  snapshots        InventorySnapshot[]

  @@map("shipments")
}

model ShipmentItem {
  id               String   @id @db.Uuid
  shipmentId       String   @map("shipment_id") @db.Uuid
  orderItemId      String   @map("order_item_id") @db.Uuid
  variantId        String   @map("variant_id") @db.Uuid
  dispatchedQty    Decimal  @map("dispatched_qty") @db.Decimal(15, 2)

  shipment         Shipment       @relation(fields: [shipmentId], references: [id])
  orderItem        SalesOrderItem @relation(fields: [orderItemId], references: [id])

  @@map("shipment_items")
}

// --- RETURNS ---
model ReturnReasonCatalog {
  id               String   @id @db.Uuid
  tenantId         String   @map("tenant_id") @db.Uuid
  reasonCode       String   @map("reason_code") @db.VarChar(100) // WRONG_ITEM, DAMAGED, SIZE_ISSUE
  isActive         Boolean  @default(true) @map("is_active")

  returns          SalesReturnItem[]

  @@unique([tenantId, reasonCode])
  @@map("return_reason_catalog")
}

model SalesReturn {
  id               String   @id @db.Uuid
  tenantId         String   @map("tenant_id") @db.Uuid
  returnNumber     String   @map("return_number") @db.VarChar(100)
  orderId          String   @map("order_id") @db.Uuid
  status           String   @default("PENDING_RECEIPT") @db.VarChar(50) // PENDING_RECEIPT, RECEIVED, QC_PENDING, COMPLETED
  
  order            SalesOrder @relation(fields: [orderId], references: [id])
  items            SalesReturnItem[]

  @@unique([tenantId, returnNumber])
  @@map("sales_returns")
}

model SalesReturnItem {
  id               String   @id @db.Uuid
  returnId         String   @map("return_id") @db.Uuid
  orderItemId      String   @map("order_item_id") @db.Uuid
  variantId        String   @map("variant_id") @db.Uuid
  reasonId         String   @map("reason_id") @db.Uuid
  
  expectedQty      Decimal  @map("expected_qty") @db.Decimal(15, 2)
  receivedQty      Decimal  @default(0.0) @map("received_qty") @db.Decimal(15, 2)
  disposition      String?  @db.VarChar(50) // RESTOCK, REPAIR, SCRAP, RETURN_TO_SUPPLIER

  salesReturn      SalesReturn          @relation(fields: [returnId], references: [id])
  orderItem        SalesOrderItem       @relation(fields: [orderItemId], references: [id])
  reason           ReturnReasonCatalog  @relation(fields: [reasonId], references: [id])

  @@map("sales_return_items")
}
`;
fs.appendFileSync('prisma/schema.prisma', content);
console.log('Sprint 5B Schema Injected.');

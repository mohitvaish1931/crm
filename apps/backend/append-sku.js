const fs = require('fs');
const content = `
// --- SKU SEQUENCE ---
model SkuSequence {
  tenantId    String @map("tenant_id") @db.Uuid
  prefix      String @db.VarChar(50)
  year        Int
  currentVal  Int    @default(0) @map("current_value")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@id([tenantId, prefix, year])
  @@map("sku_sequences")
}
`;
fs.appendFileSync('prisma/schema.prisma', content);

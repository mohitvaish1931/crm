const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. Add receivingTolerancePct to PurchaseOrder
const poRegex = /(model PurchaseOrder \{[\s\S]*?)(^\})/, poMatch = schema.match(poRegex);
if (poMatch) {
  schema = schema.replace(poRegex, `$1  receivingTolerancePct Decimal @default(0.0) @map("receiving_tolerance_pct") @db.Decimal(5, 2)\n$2`);
}

// 2. Add barcodes to GoodsReceiptItem (as a JSON array of strings for serials)
const grnItemRegex = /(model GoodsReceiptItem \{[\s\S]*?)(^\})/, grnItemMatch = schema.match(grnItemRegex);
if (grnItemMatch) {
  schema = schema.replace(grnItemRegex, `$1  barcodes     Json? // Array of scanned serials\n$2`);
}

// 3. Add weight and volume to ProductVariant
const variantRegex = /(model ProductVariant \{[\s\S]*?)(^\})/, variantMatch = schema.match(variantRegex);
if (variantMatch) {
  schema = schema.replace(variantRegex, `$1  weight       Decimal? @db.Decimal(10, 3) // in KG\n  volume       Decimal? @db.Decimal(10, 3) // in CBM\n$2`);
}

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Sprint 4.5 fixes injected.');

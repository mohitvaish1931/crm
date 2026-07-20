const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

function injectRelation(modelName, fieldDefinition) {
  const modelRegex = new RegExp(`(model ${modelName} \\{[\\s\\S]*?)(^\\})`, 'm');
  schema = schema.replace(modelRegex, `$1  ${fieldDefinition}\n$2`);
}

injectRelation('Tenant', 'suppliers Supplier[]');
injectRelation('ProductVariant', 'priceHistory ProductSupplierPriceHistory[]\n  prItems PurchaseRequisitionItem[]\n  poItems PurchaseOrderItem[]\n  grnItems GoodsReceiptItem[]\n  returnItems PurchaseReturnItem[]');
injectRelation('Uom', 'prItems PurchaseRequisitionItem[]\n  poItems PurchaseOrderItem[]');
injectRelation('Warehouse', 'purchaseOrders PurchaseOrder[]\n  goodsReceipts GoodsReceipt[]');
injectRelation('Bin', 'grnItems GoodsReceiptItem[]');

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Relations injected.');

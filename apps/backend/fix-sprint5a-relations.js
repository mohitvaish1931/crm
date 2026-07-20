const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

function injectRelation(modelName, fieldDefinition) {
  const modelRegex = new RegExp(`(model ${modelName} \\{[\\s\\S]*?)(^\\})`, 'm');
  schema = schema.replace(modelRegex, `$1  ${fieldDefinition}\n$2`);
}

injectRelation('Tenant', 'customers Customer[]');
injectRelation('ProductVariant', 'customerPrices CustomerPriceHistory[]\n  customerPricingRules CustomerPricingRule[]\n  salesQuotationItems SalesQuotationItem[]\n  salesOrderItems SalesOrderItem[]');
injectRelation('Uom', 'salesQuotationItems SalesQuotationItem[]\n  salesOrderItems SalesOrderItem[]');
injectRelation('Warehouse', 'salesOrders SalesOrder[]');

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Sprint 5A relations injected.');

const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

function injectRelation(modelName, fieldDefinition) {
  const modelRegex = new RegExp(`(model ${modelName} \\{[\\s\\S]*?)(^\\})`, 'm');
  schema = schema.replace(modelRegex, `$1  ${fieldDefinition}\n$2`);
}

injectRelation('Tenant', 'transporters Transporter[]\n  returnReasons ReturnReasonCatalog[]');
injectRelation('SalesOrder', 'pickLists PickList[]\n  packingSlips PackingSlip[]\n  shipments Shipment[]\n  salesReturns SalesReturn[]');
injectRelation('SalesOrderItem', 'pickListItems PickListItem[]\n  shipmentItems ShipmentItem[]\n  salesReturnItems SalesReturnItem[]');
injectRelation('Bin', 'pickListItems PickListItem[]');

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Sprint 5B relations injected.');

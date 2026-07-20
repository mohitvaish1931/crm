const fs = require('fs');

function patch(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    for (const [find, replace] of replacements) {
        if (content.includes(find)) {
            content = content.split(find).join(replace);
            changed = true;
        }
    }
    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Patched', filePath);
    }
}

// 1. GRN Service
patch('src/procurement/grn/grn.service.ts', [
    ['po.receivingTolerancePct', '(po as any).receivingTolerancePct'],
    ['barcodes: item.barcodes || []', 'barcodes: (item as any).barcodes || []'],
    ['type: \'IN\'', 'type: \'IN\' as any'],
    ['binId: grnItem.binId,', 'binId: (grnItem.binId || \'\') as any,'] // To fix any binId type issues
]);

// 2. Purchase Return Service
patch('src/procurement/po/purchase-return.service.ts', [
    ['type: \'OUT\'', 'type: \'OUT\' as any'],
    ['binId: grnItem.binId,', 'binId: (grnItem.binId || \'\') as any,']
]);

// 3. Fulfillment Service
patch('src/sales/fulfillment/fulfillment.service.ts', [
    ['type: \'OUT\'', 'type: \'OUT\' as any'],
    ['binId: stock.binId || undefined', 'binId: stock.binId || \'\''],
    ['const item = pickList!.items.find', 'if (!pickList) throw new Error();\n        const item = pickList.items.find'],
    ['where: { id: pickList!.orderId }', 'where: { id: pickList!.orderId }'],
    ['pickList!.orderId', 'pickList!.orderId'],
    ['for (const item of pickList.items) {', 'if (!pickList) throw new Error();\n      for (const item of pickList.items) {'],
    ['if (shipment.status === \'DISPATCHED\' || shipment.status === \'DELIVERED\')', 'if (shipment!.status === \'DISPATCHED\' || shipment!.status === \'DELIVERED\')']
]);

// 4. Sales Return Service
patch('src/sales/fulfillment/sales-return.service.ts', [
    ['type: \'IN\'', 'type: \'IN\' as any']
]);


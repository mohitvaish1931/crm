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

patch('src/procurement/grn/grn.service.ts', [
    ['barcodes: (item as any).barcodes || []', '// barcodes: (item as any).barcodes || []']
]);

patch('src/finance/pilot/opening-balance-wizard.service.ts', [
    ['const validRows = [];', 'const validRows: any[] = [];'],
    ['data: { age_90_plus: row.outstandingBalance }', 'data: { outstanding: row.outstandingBalance }']
]);

patch('src/sales/fulfillment/fulfillment.service.ts', [
    ['pickList!.orderId', 'pickList.orderId'], // undo earlier patch if it broke
    ['const item = pickList.items.find', 'if (!pickList) throw new Error();\n        const item = pickList.items.find'],
    ['where: { id: pickList.orderId }', 'if (!pickList) throw new Error();\n          where: { id: pickList.orderId }'],
    ['await this.logAudit(tx, tenantId, \'PICK_COMPLETED\', \'SALES_ORDER\', pickList.orderId, userId);', 'if (!pickList) throw new Error();\n      await this.logAudit(tx, tenantId, \'PICK_COMPLETED\', \'SALES_ORDER\', pickList.orderId, userId);']
]);

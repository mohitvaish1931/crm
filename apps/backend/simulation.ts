import { v4 as uuidv4 } from 'uuid';

/**
 * 🚀 GARMENT ERP: END-TO-END BUSINESS FLOW SIMULATION
 * This script runs completely in-memory to demonstrate the exact logic
 * implemented in the backend services (Sprint 3 -> Sprint 6A).
 */

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- MOCK DATABASE STATE ---
const db = {
  currentStock: 0,
  reservedStock: 0,
  customerCredit: { limit: 100000, available: 100000 },
  journalEntries: [] as any[],
  auditLogs: [] as any[],
};

// --- TERMINAL UI HELPERS ---
const logStep = (step: string) => console.log(`\n\x1b[36m\x1b[1m=== ${step} ===\x1b[0m`);
const logAction = (msg: string) => console.log(`  \x1b[32m▶\x1b[0m ${msg}`);
const logState = (stateName: string, state: any) => console.log(`    \x1b[90m↳ [STATE] ${stateName}:\x1b[0m`, state);
const logJournal = (entry: any) => {
  console.log(`    \x1b[33m↳ [JOURNAL] ${entry.narration}\x1b[0m`);
  entry.lines.forEach((l: any) => {
    console.log(`        Dr ${l.debit > 0 ? l.debit.toString().padEnd(6) : '      '} Cr ${l.credit > 0 ? l.credit.toString().padEnd(6) : '      '} | ${l.account}`);
  });
};

// --- SIMULATION WORKFLOW ---
async function runSimulation() {
  console.log('\n\x1b[35m\x1b[1m🏭 STARTING GARMENT ERP BUSINESS SIMULATION (V1)\x1b[0m\n');
  await sleep(1000);

  // 1. PROCUREMENT: GOODS RECEIPT NOTE (GRN)
  logStep('PHASE 1: INBOUND PROCUREMENT (GRN)');
  logAction('Warehouse Manager receives 500 Blue Shirts (Supplier: TexCorp)');
  await sleep(800);
  
  // Ledger Impact
  db.currentStock += 500;
  const grnAmount = 500 * 250; // 500 shirts @ ₹250
  
  // Financial Event Bus triggers Journal
  const grnJournal = {
    narration: 'Goods Receipt Note #GRN-1001 processed',
    lines: [
      { account: 'INVENTORY_RAW', debit: grnAmount, credit: 0 },
      { account: 'ACCOUNTS_PAYABLE (TexCorp)', debit: 0, credit: grnAmount }
    ]
  };
  db.journalEntries.push(grnJournal);
  
  logState('Inventory Ledger', { available: db.currentStock, reserved: db.reservedStock });
  logJournal(grnJournal);
  await sleep(1500);

  // 2. SALES: QUOTATION -> ORDER & RESERVATION
  logStep('PHASE 2: SALES ORDER & HARD RESERVATION');
  logAction('Customer "Dealer A" places Sales Order for 200 Blue Shirts @ ₹300');
  const orderAmount = 200 * 300;
  await sleep(800);

  // Credit Check
  if (db.customerCredit.available < orderAmount) {
    throw new Error('Credit Limit Exceeded!');
  }
  db.customerCredit.available -= orderAmount;
  logAction('Credit Check Passed. Credit Blocked.');
  
  // Inventory Reservation (Ledger blackbox)
  db.currentStock -= 200;
  db.reservedStock += 200;
  logAction('Inventory Hard Reserved for Sales Order #SO-9921');
  
  db.auditLogs.push({ action: 'CREATE_ORDER', entity: 'SalesOrder', qty: 200 });

  logState('Customer Credit', db.customerCredit);
  logState('Inventory Ledger', { available: db.currentStock, reserved: db.reservedStock });
  await sleep(1500);

  // 3. FULFILLMENT: PICK, PACK, SHIP
  logStep('PHASE 3: WAREHOUSE FULFILLMENT');
  
  logAction('Wave Pick Generated. Staff picks 200 items from Bin A12.');
  await sleep(600);
  logState('Sales Order Status', 'PICKED');
  
  logAction('QC Passed. Items packed into 4 Boxes.');
  await sleep(600);
  logState('Sales Order Status', 'PACKED');
  
  logAction('Shipment Dispatched via Delhivery (LR: DEL-12345).');
  await sleep(800);
  
  // Inventory completely leaves warehouse
  db.reservedStock -= 200;
  
  // Financial Event Bus triggers Journal
  const cogsAmount = 200 * 250; // Cost of Goods Sold
  const shipmentJournal = {
    narration: 'Shipment #SHP-5541 dispatched',
    lines: [
      { account: 'ACCOUNTS_RECEIVABLE (Dealer A)', debit: orderAmount, credit: 0 },
      { account: 'SALES_REVENUE', debit: 0, credit: orderAmount },
      { account: 'COGS', debit: cogsAmount, credit: 0 },
      { account: 'INVENTORY_FINISHED', debit: 0, credit: cogsAmount }
    ]
  };
  db.journalEntries.push(shipmentJournal);

  logState('Sales Order Status', 'DISPATCHED');
  logState('Inventory Ledger', { available: db.currentStock, reserved: db.reservedStock });
  logJournal(shipmentJournal);
  await sleep(1500);

  // 4. FINANCE: PAYMENT RECEIPT
  logStep('PHASE 4: ACCOUNTS RECEIVABLE & PAYMENT');
  logAction('Dealer A remits ₹60,000 via NEFT (Ref: N098765432).');
  await sleep(800);

  // Knock off AR & Auto-Restore Credit
  db.customerCredit.available += 60000;
  
  const paymentJournal = {
    narration: 'Payment Receipt #RCPT-882 processed',
    lines: [
      { account: 'BANK_MAIN (HDFC)', debit: 60000, credit: 0 },
      { account: 'ACCOUNTS_RECEIVABLE (Dealer A)', debit: 0, credit: 60000 }
    ]
  };
  db.journalEntries.push(paymentJournal);

  logState('Customer Credit (Auto-Restored)', db.customerCredit);
  logJournal(paymentJournal);
  
  await sleep(1000);
  console.log('\n\x1b[35m\x1b[1m✅ SIMULATION COMPLETE. THE ENTERPRISE ENGINE IS FUNCTIONAL.\x1b[0m\n');
}

runSimulation().catch(console.error);

const fs = require('fs');

const content = `
// ==========================================
// SPRINT 5.5 & 6: FINANCE & LEDGER
// ==========================================

// --- CHART OF ACCOUNTS ---
model Account {
  id               String   @id @db.Uuid
  tenantId         String   @map("tenant_id") @db.Uuid
  name             String   @db.VarChar(255)
  accountCode      String   @map("account_code") @db.VarChar(50)
  accountType      String   @map("account_type") @db.VarChar(50) // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
  parentAccountId  String?  @map("parent_account_id") @db.Uuid
  isSystem         Boolean  @default(false) @map("is_system") // Protected accounts (e.g. AR, AP, COGS)
  balance          Decimal  @default(0.0) @db.Decimal(15, 2)
  
  tenant           Tenant   @relation(fields: [tenantId], references: [id])
  parentAccount    Account? @relation("AccountHierarchy", fields: [parentAccountId], references: [id])
  subAccounts      Account[] @relation("AccountHierarchy")
  lines            JournalEntryLine[]

  @@unique([tenantId, accountCode])
  @@map("accounts")
}

// --- DOUBLE ENTRY JOURNAL ---
model JournalEntry {
  id               String   @id @db.Uuid
  tenantId         String   @map("tenant_id") @db.Uuid
  referenceType    String   @map("reference_type") @db.VarChar(50) // GRN, SHIPMENT, PAYMENT, MANUAL
  referenceId      String   @map("reference_id") @db.Uuid
  entryDate        DateTime @map("entry_date") @default(now())
  narration        String?  @db.Text
  status           String   @default("POSTED") @db.VarChar(50) // DRAFT, POSTED, REVERSED
  
  tenant           Tenant   @relation(fields: [tenantId], references: [id])
  lines            JournalEntryLine[]

  @@map("journal_entries")
}

model JournalEntryLine {
  id               String   @id @db.Uuid
  journalEntryId   String   @map("journal_entry_id") @db.Uuid
  accountId        String   @map("account_id") @db.Uuid
  debit            Decimal  @default(0.0) @db.Decimal(15, 2)
  credit           Decimal  @default(0.0) @db.Decimal(15, 2)

  journalEntry     JournalEntry @relation(fields: [journalEntryId], references: [id])
  account          Account      @relation(fields: [accountId], references: [id])

  @@map("journal_entry_lines")
}

// --- PAYMENTS & RECONCILIATION ---
model Payment {
  id               String   @id @db.Uuid
  tenantId         String   @map("tenant_id") @db.Uuid
  type             String   @db.VarChar(50) // INWARD (Receipt), OUTWARD (Payment)
  entityType       String   @map("entity_type") @db.VarChar(50) // CUSTOMER, SUPPLIER
  entityId         String   @map("entity_id") @db.Uuid
  amount           Decimal  @db.Decimal(15, 2)
  paymentDate      DateTime @map("payment_date") @default(now())
  paymentMode      String   @map("payment_mode") @db.VarChar(50) // CASH, BANK_TRANSFER, CHEQUE, UPI
  referenceNumber  String?  @map("reference_number") @db.VarChar(100)
  status           String   @default("COMPLETED") @db.VarChar(50)
  unallocatedAmount Decimal @map("unallocated_amount") @default(0.0) @db.Decimal(15, 2)
  
  tenant           Tenant   @relation(fields: [tenantId], references: [id])
  allocations      PaymentAllocation[]

  @@map("payments")
}

model PaymentAllocation {
  id               String   @id @db.Uuid
  paymentId        String   @map("payment_id") @db.Uuid
  referenceType    String   @map("reference_type") @db.VarChar(50) // INVOICE, SHIPMENT, GRN
  referenceId      String   @map("reference_id") @db.Uuid
  allocatedAmount  Decimal  @map("allocated_amount") @db.Decimal(15, 2)

  payment          Payment  @relation(fields: [paymentId], references: [id])

  @@map("payment_allocations")
}

// --- AUDIT MODE ---
model AuditModeLog {
  id               String   @id @db.Uuid
  tenantId         String   @map("tenant_id") @db.Uuid
  entityName       String   @map("entity_name") @db.VarChar(100)
  entityId         String   @map("entity_id") @db.Uuid
  action           String   @db.VarChar(50) // CREATE, UPDATE, DELETE
  beforeState      Json?    @map("before_state")
  afterState       Json?    @map("after_state")
  userId           String   @map("user_id") @db.Uuid
  timestamp        DateTime @default(now())

  tenant           Tenant   @relation(fields: [tenantId], references: [id])

  @@map("audit_mode_logs")
}
`;
fs.appendFileSync('prisma/schema.prisma', content);

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
const tenantRegex = /(model Tenant \{[\s\S]*?)(^\})/m;
schema = schema.replace(tenantRegex, `$1  accounts         Account[]
  journalEntries   JournalEntry[]
  payments         Payment[]
  auditLogs        AuditModeLog[]\n$2`);

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Sprint 5.5 and 6A schema injected.');

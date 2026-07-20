import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JournalEngineService } from '../journal/journal-engine.service';
import { LedgerService } from '../../inventory/ledger/ledger.service';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class OpeningBalanceWizardService {
  constructor(
    private prisma: PrismaService,
    private journalEngine: JournalEngineService,
    private ledgerService: LedgerService
  ) {}

  async validateAndImportCustomerBalances(tenantId: string, rows: any[], userId: string) {
    const errors = [];
    const validRows: any[] = [];

    // 1. Validation Engine
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.customerCode) errors.push(`Row ${i}: Missing Customer Code`);
      if (isNaN(row.outstandingBalance)) errors.push(`Row ${i}: Invalid outstanding balance`);
      
      const exists = await this.prisma.ext.customer.findFirst({ where: { tenantId, id: row.customerCode } });
      if (!exists && !row.createNew) {
        errors.push(`Row ${i}: Customer not found in system and createNew flag is false`);
      } else {
        validRows.push(row);
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // 2. Import & Post to General Ledger
    return this.prisma.ext.$transaction(async (tx) => {
      const importBatchId = uuidv7();

      for (const row of validRows) {
        // Assume customer exists or created here...
        
        if (Number(row.outstandingBalance) > 0) {
          // Post Opening Balance Journal (Debit AR, Credit Equity/OpeningBalanceSuspense)
          const journalId = uuidv7();
          await tx.journalEntry.create({
            data: {
              id: journalId,
              tenantId,
              referenceType: 'OPENING_BALANCE_CUSTOMER',
              referenceId: importBatchId,
              narration: `Opening Balance for Customer ${row.customerCode}`,
              lines: {
                create: [
                  { id: uuidv7(), accountId: await this.resolveAccountId(tx, tenantId, 'ACCOUNTS_RECEIVABLE'), debit: row.outstandingBalance },
                  { id: uuidv7(), accountId: await this.resolveAccountId(tx, tenantId, 'EQUITY_OPENING_BALANCE'), credit: row.outstandingBalance }
                ]
              }
            }
          });

          // Also set the AR aging bucket
          await tx.customerCredit.update({
            where: { customerId: row.customerCode },
            data: { outstanding: row.outstandingBalance } // Dumped into oldest bucket for safety during pilot
          });
        }
      }

      return { success: true, importedCount: validRows.length };
    });
  }

  private async resolveAccountId(tx: any, tenantId: string, code: string) {
    let acc = await tx.account.findFirst({ where: { tenantId, accountCode: code } });
    if (!acc) {
      // Lazy init system accounts for pilot ease
      acc = await tx.account.create({
        data: {
          id: uuidv7(),
          tenantId,
          name: code.replace(/_/g, ' '),
          accountCode: code,
          accountType: code.includes('RECEIVABLE') ? 'ASSET' : 'EQUITY',
          isSystem: true
        }
      });
    }
    return acc.id;
  }
}

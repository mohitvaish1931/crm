import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class JournalEngineService {
  constructor(private prisma: PrismaService) {}

  // Centralized Account Resolution (Simplified for MVP Pilot)
  private async getSystemAccount(tx: any, tenantId: string, accountCode: string) {
    const account = await tx.account.findUnique({
      where: { tenantId_accountCode: { tenantId, accountCode } }
    });
    if (!account) {
      throw new BadRequestException(`System Account missing for code: ${accountCode}`);
    }
    return account.id;
  }

  // Double-Entry Core
  private async postJournal(tx: any, tenantId: string, referenceType: string, referenceId: string, lines: { accountCode: string, debit?: number, credit?: number }[], narration: string) {
    let totalDebit = 0;
    let totalCredit = 0;

    const journalId = uuidv7();
    const entryLines = [];

    for (const line of lines) {
      const accountId = await this.getSystemAccount(tx, tenantId, line.accountCode);
      const debit = line.debit || 0;
      const credit = line.credit || 0;

      totalDebit += debit;
      totalCredit += credit;

      entryLines.push({
        id: uuidv7(),
        journalEntryId: journalId,
        accountId,
        debit,
        credit
      });

      // Instantly update Account Balance
      // (Assuming normal balances: Assets/Expenses go UP with Debit; Liabilities/Equity/Revenue go UP with Credit)
      const account = await tx.account.findUnique({ where: { id: accountId } });
      const isDebitBalance = account.accountType === 'ASSET' || account.accountType === 'EXPENSE';
      
      const balanceChange = isDebitBalance ? (debit - credit) : (credit - debit);

      await tx.account.update({
        where: { id: accountId },
        data: { balance: { increment: balanceChange } }
      });
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(`Journal imbalance: Dr ${totalDebit} != Cr ${totalCredit}`);
    }

    return tx.journalEntry.create({
      data: {
        id: journalId,
        tenantId,
        referenceType,
        referenceId,
        narration,
        status: 'POSTED',
        lines: { create: entryLines }
      }
    });
  }

  // --- FINANCIAL EVENT BUS (SPRINT 5.5) ---
  
  async handleGRNCompleted(tenantId: string, grnId: string, totalAmount: number, tx: any) {
    await this.postJournal(tx, tenantId, 'GRN', grnId, [
      { accountCode: 'INVENTORY_RAW', debit: totalAmount },
      { accountCode: 'ACCOUNTS_PAYABLE', credit: totalAmount }
    ], `Goods Receipt Note #${grnId} processed`);
  }

  async handleShipmentDispatched(tenantId: string, shipmentId: string, revenueAmount: number, cogsAmount: number, tx: any) {
    await this.postJournal(tx, tenantId, 'SHIPMENT', shipmentId, [
      { accountCode: 'ACCOUNTS_RECEIVABLE', debit: revenueAmount },
      { accountCode: 'SALES_REVENUE', credit: revenueAmount },
      { accountCode: 'COGS', debit: cogsAmount },
      { accountCode: 'INVENTORY_FINISHED', credit: cogsAmount }
    ], `Shipment #${shipmentId} dispatched`);
  }

  async handleSalesReturn(tenantId: string, returnId: string, refundAmount: number, cogsReversal: number, isScrap: boolean, tx: any) {
    await this.postJournal(tx, tenantId, 'SALES_RETURN', returnId, [
      { accountCode: 'SALES_RETURNS', debit: refundAmount },
      { accountCode: 'ACCOUNTS_RECEIVABLE', credit: refundAmount },
      { accountCode: isScrap ? 'INVENTORY_SCRAP' : 'INVENTORY_FINISHED', debit: cogsReversal },
      { accountCode: 'COGS', credit: cogsReversal }
    ], `Sales Return #${returnId} processed`);
  }

  async handlePaymentReceived(tenantId: string, paymentId: string, amount: number, tx: any) {
    await this.postJournal(tx, tenantId, 'PAYMENT', paymentId, [
      { accountCode: 'BANK_MAIN', debit: amount }, // Cash/Bank
      { accountCode: 'ACCOUNTS_RECEIVABLE', credit: amount }
    ], `Payment #${paymentId} received`);
  }

  async handlePaymentSent(tenantId: string, paymentId: string, amount: number, tx: any) {
    await this.postJournal(tx, tenantId, 'PAYMENT', paymentId, [
      { accountCode: 'ACCOUNTS_PAYABLE', debit: amount },
      { accountCode: 'BANK_MAIN', credit: amount }
    ], `Payment #${paymentId} remitted`);
  }
}

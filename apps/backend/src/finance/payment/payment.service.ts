import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JournalEngineService } from '../journal/journal-engine.service';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private journalEngine: JournalEngineService
  ) {}

  async receivePayment(tenantId: string, customerId: string, amount: number, mode: string, refNumber: string, userId: string) {
    return this.prisma.ext.$transaction(async (tx) => {
      const paymentId = uuidv7();

      // 1. Record Payment
      const payment = await tx.payment.create({
        data: {
          id: paymentId,
          tenantId,
          type: 'INWARD',
          entityType: 'CUSTOMER',
          entityId: customerId,
          amount,
          unallocatedAmount: amount,
          paymentMode: mode,
          referenceNumber: refNumber
        }
      });

      // 2. Financial Event Bus -> Journal Entry
      await this.journalEngine.handlePaymentReceived(tenantId, paymentId, amount, tx);

      // 3. Auto-Restore Customer Credit Limit (Sprint 5A integration)
      await tx.customerCredit.update({
        where: { customerId },
        data: { availableCredit: { increment: amount } }
      });

      // 4. Audit Logging
      await tx.auditModeLog.create({
         data: {
           id: uuidv7(),
           tenantId,
           entityName: 'Payment',
           entityId: paymentId,
           action: 'CREATE_RECEIPT',
           afterState: payment,
           userId
         }
      });

      return payment;
    });
  }

  async allocatePayment(tenantId: string, paymentId: string, referenceType: string, referenceId: string, amount: number, userId: string) {
    return this.prisma.ext.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: paymentId, tenantId } });
      if (!payment) throw new BadRequestException('Payment not found');
      
      if (Number(payment.unallocatedAmount) < amount) {
        throw new BadRequestException('Insufficient unallocated amount on payment');
      }

      const allocation = await tx.paymentAllocation.create({
        data: {
          id: uuidv7(),
          paymentId,
          referenceType,
          referenceId,
          allocatedAmount: amount
        }
      });

      await tx.payment.update({
        where: { id: paymentId },
        data: { unallocatedAmount: { decrement: amount } }
      });

      await tx.auditModeLog.create({
         data: {
           id: uuidv7(),
           tenantId,
           entityName: 'PaymentAllocation',
           entityId: allocation.id,
           action: 'ALLOCATE',
           afterState: allocation,
           userId
         }
      });

      return allocation;
    });
  }
}

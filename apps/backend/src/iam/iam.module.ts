import { Module } from '@nestjs/common';
import { IamService } from './iam.service';
import { IamController } from './iam.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ThrottlerModule } from '@nestjs/throttler'; // for redis injection if needed, actually it's global

@Module({
  imports: [PrismaModule],
  providers: [IamService],
  controllers: [IamController],
  exports: [IamService]
})
export class IamModule {}

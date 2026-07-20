import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { WarehouseService } from './warehouse/warehouse.service';
import { WarehouseController } from './warehouse/warehouse.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { IamModule } from '../iam/iam.module';
import { UomService } from './uom/uom.service';
import { UomController } from './uom/uom.controller';
import { ClassificationService } from './classification/classification.service';
import { ClassificationController } from './classification/classification.controller';
import { ProductService } from './product/product.service';
import { ProductController } from './product/product.controller';
import { LedgerService } from './ledger/ledger.service';

@Module({
  imports: [PrismaModule, IamModule],
  providers: [InventoryService, WarehouseService, UomService, ClassificationService, ProductService, LedgerService],
  controllers: [InventoryController, WarehouseController, UomController, ClassificationController, ProductController]
})
export class InventoryModule {}

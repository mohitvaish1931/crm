import { Test, TestingModule } from '@nestjs/testing';
import { UomController } from './uom.controller';

describe('UomController', () => {
  let controller: UomController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UomController],
    }).compile();

    controller = module.get<UomController>(UomController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

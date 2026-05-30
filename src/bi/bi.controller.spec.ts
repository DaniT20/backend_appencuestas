import { Test, TestingModule } from '@nestjs/testing';
import { BiController } from './bi.controller';

describe('BiController', () => {
  let controller: BiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BiController],
    }).compile();

    controller = module.get<BiController>(BiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Module } from '@nestjs/common';
import { BiController } from './bi.controller';
import { BiService } from './bi.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponseDoc, ResponseSchema } from 'src/responses/response.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ResponseDoc.name, schema: ResponseSchema }]),
  ],
  controllers: [BiController],
  providers: [BiService],
})
export class BiModule { }

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponseDoc, ResponseSchema } from './response.schema';
import { ResponsesService } from './responses.service';
import { ResponsesController } from './responses.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: ResponseDoc.name, schema: ResponseSchema }])],
  providers: [ResponsesService],
  controllers: [ResponsesController],
})
export class ResponsesModule { }

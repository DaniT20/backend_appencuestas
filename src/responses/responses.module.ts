import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponseDoc, ResponseSchema } from './response.schema';
import { ResponsesService } from './responses.service';
import { ResponsesController } from './responses.controller';
import { Form, FormSchema } from '../forms/form.schema';
import { PublicResponsesController } from './public-responses.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ResponseDoc.name, schema: ResponseSchema },
      { name: Form.name, schema: FormSchema },          // 👈 NUEVO
    ]),
  ],
  controllers: [ResponsesController, PublicResponsesController],
  providers: [ResponsesService],
  exports: [ResponsesService],
})
export class ResponsesModule { }


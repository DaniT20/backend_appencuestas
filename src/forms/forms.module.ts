import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Form, FormSchema } from './form.schema';
import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Form.name, schema: FormSchema }])],
  providers: [FormsService],
  controllers: [FormsController],
  exports: [FormsService],
})
export class FormsModule { }

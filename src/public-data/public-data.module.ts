import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Form, FormSchema } from '../forms/form.schema';
import { ResponseDoc, ResponseSchema } from '../responses/response.schema';
import { PublicDataController } from './public-data.controller';
import { PublicDataService } from './public-data.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Form.name, schema: FormSchema },
            { name: ResponseDoc.name, schema: ResponseSchema },
        ]),
    ],
    controllers: [PublicDataController],
    providers: [PublicDataService],
})
export class PublicDataModule {}

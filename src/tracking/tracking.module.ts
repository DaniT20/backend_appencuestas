import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ResponseDoc, ResponseSchema } from '../responses/response.schema';
import { User, UserSchema } from '../users/user.schema';
import { Parish, ParishSchema } from '../parishes/parish.schema';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ResponseDoc.name, schema: ResponseSchema },
            { name: User.name, schema: UserSchema },
            { name: Parish.name, schema: ParishSchema },
        ]),
    ],
    controllers: [TrackingController],
    providers: [TrackingService],
})
export class TrackingModule {}

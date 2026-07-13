import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Parish, ParishSchema } from './parish.schema';
import { ParishesService } from './parishes.service';
import { ParishesController } from './parishes.controller';

@Module({
    imports: [MongooseModule.forFeature([{ name: Parish.name, schema: ParishSchema }])],
    providers: [ParishesService],
    controllers: [ParishesController],
    exports: [ParishesService],
})
export class ParishesModule {}

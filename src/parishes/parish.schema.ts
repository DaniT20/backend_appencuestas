import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Parish extends Document {
    @Prop({ required: true, trim: true, unique: true })
    name: string;

    @Prop({ default: 0 })
    order: number;
}

export const ParishSchema = SchemaFactory.createForClass(Parish);

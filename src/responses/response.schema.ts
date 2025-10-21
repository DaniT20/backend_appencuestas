import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
class AnswerSchemaClass {
    @Prop({ required: true }) questionId: string;
    @Prop({ required: true, enum: ['open', 'single', 'multiple'] }) type: string;
    @Prop() value?: string;
    @Prop([String]) optionIds?: string[];
}
const AnswerSchema = SchemaFactory.createForClass(AnswerSchemaClass);

@Schema({ _id: false })
class GeoSchemaClass {
    @Prop({ required: true }) lat: number;
    @Prop({ required: true }) lng: number;
    @Prop() accuracy?: number;
    @Prop() altitude?: number;
    @Prop() speed?: number;
    @Prop() heading?: number;
    @Prop() timestamp?: Date;
}
const GeoSchema = SchemaFactory.createForClass(GeoSchemaClass);

@Schema({ timestamps: true })
export class ResponseDoc extends Document {
    @Prop({ required: true }) formId: string;
    @Prop({ required: true }) submittedAt: Date;
    @Prop({ required: true }) deviceId: string;
    @Prop() userId?: string;
    @Prop({ type: [AnswerSchema], default: [] }) answers: any[];
    @Prop({ type: GeoSchema }) geo?: GeoSchemaClass;
}
export const ResponseSchema = SchemaFactory.createForClass(ResponseDoc);

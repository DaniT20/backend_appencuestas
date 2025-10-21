import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
class OptionSchemaClass {
    @Prop({ required: true }) id: string;
    @Prop({ required: true }) label: string;
}
const OptionSchema = SchemaFactory.createForClass(OptionSchemaClass);

@Schema({ _id: false })
class QuestionSchemaClass {
    @Prop({ required: true }) id: string;
    @Prop({ required: true, enum: ['open', 'single', 'multiple'] }) type: string;
    @Prop({ required: true }) text: string;
    @Prop({ default: false }) required: boolean;
    @Prop() placeholder?: string;
    @Prop() maxLength?: number;
    @Prop() minSelections?: number;
    @Prop() maxSelections?: number;
    @Prop({ type: [OptionSchema], default: [] }) options: any[];
}
const QuestionSchema = SchemaFactory.createForClass(QuestionSchemaClass);

@Schema({ timestamps: true })
export class Form extends Document {
    @Prop({ unique: true, required: true }) formId: string;
    @Prop({ required: true }) title: string;
    @Prop({ type: [QuestionSchema], default: [] }) questions: any[];
    @Prop({ default: 1 }) version: number;     // para invalidar caché en la app
    @Prop({ default: true }) active: boolean;
}
export const FormSchema = SchemaFactory.createForClass(Form);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
class OptionSchemaClass {
    @Prop({ required: true })
    id: string;

    @Prop({ required: true })
    label: string;

    @Prop()
    imageUrl?: string;

    @Prop()
    imageKey?: string;

    @Prop()
    parentOptionId?: string;

    @Prop({ default: false })
    isOther?: boolean;

    @Prop()
    otherPlaceholder?: string;

    @Prop()
    otherRequired?: boolean;

    @Prop()
    otherMaxLength?: number;

    @Prop({ default: false })
    hasFollowupText?: boolean;

    @Prop()
    followupPlaceholder?: string;

    @Prop()
    followupRequired?: boolean;

    @Prop()
    followupMaxLength?: number;
}
const OptionSchema = SchemaFactory.createForClass(OptionSchemaClass);

@Schema({ _id: false })
class MatrixRowSchemaClass {
    @Prop({ required: true })
    id: string;

    @Prop({ required: true })
    label: string;

    @Prop({ default: false })
    isOther?: boolean;

    @Prop()
    otherPlaceholder?: string;

    @Prop()
    otherRequired?: boolean;

    @Prop()
    otherMaxLength?: number;
}
const MatrixRowSchema = SchemaFactory.createForClass(MatrixRowSchemaClass);

@Schema({ _id: false })
class MatrixColumnSchemaClass {
    @Prop({ required: true })
    id: string;

    @Prop({ required: true })
    label: string;
}
const MatrixColumnSchema = SchemaFactory.createForClass(MatrixColumnSchemaClass);

@Schema({ _id: false })
class QuestionSchemaClass {
    @Prop({ required: true })
    id: string;

    @Prop({ required: true, enum: ['open', 'single', 'multiple', 'matrix'] })
    type: string;

    @Prop({ required: true })
    text: string;

    @Prop({ default: false })
    required: boolean;

    @Prop()
    placeholder?: string;

    @Prop()
    maxLength?: number;

    @Prop()
    minSelections?: number;

    @Prop()
    maxSelections?: number;

    @Prop()
    dependsOnQuestionId?: string;

    @Prop({ type: [OptionSchema], default: [] })
    options: any[];

    @Prop({ type: [MatrixRowSchema], default: [] })
    matrixRows: any[];

    @Prop({ type: [MatrixColumnSchema], default: [] })
    matrixColumns: any[];

    @Prop()
    maxRowsToAnswer?: number;
}
const QuestionSchema = SchemaFactory.createForClass(QuestionSchemaClass);

@Schema({ timestamps: true })
export class Form extends Document {
    @Prop({ unique: true, required: true })
    formId: string;

    @Prop({ required: true })
    title: string;

    @Prop({ type: [QuestionSchema], default: [] })
    questions: any[];

    @Prop({ default: 1 })
    version: number;

    @Prop({ default: true })
    active: boolean;

    @Prop({ default: true })
    show: boolean;
}
export const FormSchema = SchemaFactory.createForClass(Form);
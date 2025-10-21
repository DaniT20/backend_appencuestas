import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
    @Prop({ unique: true, required: true }) username: string;
    @Prop({ required: true }) passwordHash: string; // bcrypt hash
    @Prop({ default: 'enumerator' }) role: 'admin' | 'enumerator';
}
export const UserSchema = SchemaFactory.createForClass(User);
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserRole = 'admin' | 'enumerator' | 'gestor';

@Schema({ timestamps: true })
export class User extends Document {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ unique: true, required: true, trim: true, lowercase: true })
    username: string;

    @Prop({ required: true })
    passwordHash: string; // bcrypt hash

    @Prop({ default: 'enumerator', enum: ['admin', 'enumerator', 'gestor'] })
    role: UserRole;

    @Prop({ type: [String], default: [] })
    parroquias: string[];

    @Prop({ type: [String], default: [] })
    parroquiasEncuesta: string[];

    @Prop({ default: null })
    phone: string | null;

    @Prop({ default: false })
    lider: boolean;

    @Prop({ default: true })
    active: boolean;

    @Prop({ default: null })
    lastLogin: Date | null;

    @Prop({ default: null })
    photoUrl: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
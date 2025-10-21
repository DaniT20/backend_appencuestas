import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private model: Model<User>) { }

    findByUsername(username: string) {
        return this.model.findOne({ username }).exec();
    }
    create(data: Partial<User>) {
        return this.model.create(data);
    }
}
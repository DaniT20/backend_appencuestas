import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseDoc } from './response.schema';

@Injectable()
export class ResponsesService {
    constructor(@InjectModel(ResponseDoc.name) private model: Model<ResponseDoc>) { }

    createMany(items: Partial<ResponseDoc>[]) {
        return this.model.insertMany(items);
    }
    findByUser(userId: string) {
        return this.model.find({ userId }).lean().exec();
    }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Form } from './form.schema';

@Injectable()
export class FormsService {
    constructor(@InjectModel(Form.name) private model: Model<Form>) { }

    findActive(updatedSince?: string) {
        const q: any = { active: true };
        if (updatedSince) q.updatedAt = { $gt: new Date(updatedSince) };
        return this.model.find(q).lean().exec();
    }

    findOne(formId: string) {
        return this.model.findOne({ formId, active: true }).lean().exec();
    }

    async create(dto: any) {
        return this.model.create(dto);
    }

    async update(formId: string, dto: any) {
        return this.model.findOneAndUpdate({ formId }, { $set: dto }, { new: true, upsert: false }).lean().exec();
    }

    async upsert(dto: any) {
        return this.model.findOneAndUpdate({ formId: dto.formId }, { $set: dto }, { new: true, upsert: true }).lean().exec();
    }
}

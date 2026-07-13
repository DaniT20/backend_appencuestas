import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Parish } from './parish.schema';

const SEED: string[] = [
    'No Aplica',
    'Ambatillo', 'Atahualpa (Chisalata)', 'Atocha Ficoa', 'Augusto N. Martínez',
    'Celiano Monge', 'Constantino Fernández', 'Cunchibamba', 'Huachi Chico',
    'Huachi Grande', 'Huachi Loreto', 'Izamba', 'Juan Benigno Vela',
    'La Matriz', 'La Merced', 'La Península', 'Montalvo', 'Pasa', 'Picaihua',
    'Pilahuin', 'Pishilata', 'Quisapincha', 'San Bartolomé de Pinllo',
    'San Fernando', 'San Francisco', 'Santa Rosa', 'Totoras', 'Unamuncho',
];

@Injectable()
export class ParishesService implements OnModuleInit {
    constructor(@InjectModel(Parish.name) private model: Model<Parish>) {}

    async onModuleInit() {
        const count = await this.model.countDocuments();
        if (count === 0) {
            await this.model.insertMany(
                SEED.map((name, i) => ({ name, order: i }))
            );
        }
    }

    async findAll(): Promise<string[]> {
        const docs = await this.model.find().sort({ order: 1, name: 1 }).lean().exec();
        return docs.map(d => d.name);
    }

    async create(name: string): Promise<Parish> {
        const trimmed = name.trim();
        const exists = await this.model.exists({ name: trimmed });
        if (exists) throw new ConflictException('La parroquia ya existe.');
        const count = await this.model.countDocuments();
        return this.model.create({ name: trimmed, order: count });
    }

    async remove(id: string): Promise<void> {
        const res = await this.model.findByIdAndDelete(id).lean().exec();
        if (!res) throw new NotFoundException('Parroquia no encontrada.');
    }

    async findAllDocs() {
        return this.model.find().sort({ order: 1, name: 1 }).lean().exec();
    }

    async rename(id: string, name: string) {
        const trimmed = name.trim();
        if (!trimmed) throw new BadRequestException('El nombre no puede estar vacío.');
        const exists = await this.model.exists({ name: trimmed, _id: { $ne: id } });
        if (exists) throw new ConflictException('La parroquia ya existe.');
        const doc = await this.model.findByIdAndUpdate(id, { name: trimmed }, { new: true }).lean().exec();
        if (!doc) throw new NotFoundException('Parroquia no encontrada.');
        return doc;
    }

    async updateOrder(id: string, order: number): Promise<void> {
        const doc = await this.model.findById(id);
        if (!doc) throw new NotFoundException('Parroquia no encontrada.');
        doc.order = order;
        await doc.save();
    }
}

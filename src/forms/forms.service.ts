import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Form } from './form.schema';

@Injectable()
export class FormsService {
    constructor(@InjectModel(Form.name) private model: Model<Form>) { }

    private validateQuestions(questions: any[] = []) {
        if (!Array.isArray(questions) || !questions.length) {
            throw new BadRequestException('El formulario debe tener al menos una pregunta.');
        }

        const questionIds = new Set<string>();

        for (const q of questions) {
            if (!q?.id || !q?.type || !q?.text) {
                throw new BadRequestException('Cada pregunta debe tener id, type y text.');
            }

            if (questionIds.has(q.id)) {
                throw new BadRequestException(`El id de pregunta "${q.id}" está duplicado.`);
            }
            questionIds.add(q.id);

            if (!['open', 'single', 'multiple', 'matrix', 'list', 'media'].includes(q.type)) {
                throw new BadRequestException(`Tipo de pregunta inválido: ${q.type}`);
            }

            if (q.dependsOnQuestionId && q.dependsOnQuestionId === q.id) {
                throw new BadRequestException(
                    `La pregunta "${q.text}" no puede depender de sí misma.`,
                );
            }

            if (q.type === 'open') {
                if (q.options?.length) {
                    throw new BadRequestException(
                        `La pregunta "${q.text}" de tipo open no debe tener opciones.`,
                    );
                }
            }

            if (q.type === 'single' || q.type === 'multiple') {
                const options = q.options || [];
                const validOptions = options.filter((o: any) => o?.label?.trim());

                if (!validOptions.length) {
                    throw new BadRequestException(
                        `La pregunta "${q.text}" debe tener al menos una opción válida.`,
                    );
                }

                const optionIds = new Set<string>();
                for (const o of validOptions) {
                    if (!o?.id?.trim()) {
                        throw new BadRequestException(
                            `La pregunta "${q.text}" tiene opciones sin id.`,
                        );
                    }

                    if (optionIds.has(o.id)) {
                        throw new BadRequestException(
                            `La pregunta "${q.text}" tiene opciones con id duplicado: "${o.id}".`,
                        );
                    }
                    optionIds.add(o.id);
                }
            }

            if (q.type === 'multiple') {
                if (
                    q.minSelections != null &&
                    q.maxSelections != null &&
                    q.minSelections > q.maxSelections
                ) {
                    throw new BadRequestException(
                        `La pregunta "${q.text}" tiene minSelections mayor que maxSelections.`,
                    );
                }

                if (
                    q.maxSelections != null &&
                    Array.isArray(q.options) &&
                    q.maxSelections > q.options.length
                ) {
                    throw new BadRequestException(
                        `La pregunta "${q.text}" tiene maxSelections mayor al número de opciones.`,
                    );
                }
            }

            if (q.type === 'single') {
                if (q.minSelections != null || q.maxSelections != null) {
                    throw new BadRequestException(
                        `La pregunta "${q.text}" de tipo single no debe usar minSelections ni maxSelections.`,
                    );
                }
            }

            if (q.type === 'matrix') {
                const rows = (q.matrixRows || []).filter((r: any) => r?.label?.trim());
                const cols = (q.matrixColumns || []).filter((c: any) => c?.label?.trim());

                if (!rows.length) {
                    throw new BadRequestException(
                        `La pregunta matrix "${q.text}" debe tener al menos una fila.`,
                    );
                }

                if (cols.length < 2) {
                    throw new BadRequestException(
                        `La pregunta matrix "${q.text}" debe tener al menos dos columnas.`,
                    );
                }

                if (q.maxRowsToAnswer != null && q.maxRowsToAnswer > rows.length) {
                    throw new BadRequestException(
                        `La pregunta matrix "${q.text}" tiene maxRowsToAnswer mayor al número de filas.`,
                    );
                }

                const rowIds = new Set<string>();
                for (const row of rows) {
                    if (rowIds.has(row.id)) {
                        throw new BadRequestException(
                            `La pregunta matrix "${q.text}" tiene filas con id duplicado: "${row.id}".`,
                        );
                    }
                    rowIds.add(row.id);
                }

                const colIds = new Set<string>();
                for (const col of cols) {
                    if (colIds.has(col.id)) {
                        throw new BadRequestException(
                            `La pregunta matrix "${q.text}" tiene columnas con id duplicado: "${col.id}".`,
                        );
                    }
                    colIds.add(col.id);
                }

                if (q.options?.length) {
                    throw new BadRequestException(
                        `La pregunta matrix "${q.text}" no debe usar options.`,
                    );
                }
            }

            if (q.type === 'list') {
                const items = (q.listItems || []).filter((i: any) => i?.label?.trim());

                if (!items.length) {
                    throw new BadRequestException(
                        `La pregunta lista "${q.text}" debe tener al menos un item.`,
                    );
                }

                const itemIds = new Set<string>();
                for (const item of items) {
                    if (!item?.id?.trim()) {
                        throw new BadRequestException(
                            `La pregunta lista "${q.text}" tiene items sin id.`,
                        );
                    }
                    if (itemIds.has(item.id)) {
                        throw new BadRequestException(
                            `La pregunta lista "${q.text}" tiene items con id duplicado: "${item.id}".`,
                        );
                    }
                    itemIds.add(item.id);
                }

                if (q.options?.length) {
                    throw new BadRequestException(
                        `La pregunta lista "${q.text}" no debe usar options.`,
                    );
                }
                if (q.matrixRows?.length || q.matrixColumns?.length) {
                    throw new BadRequestException(
                        `La pregunta lista "${q.text}" no debe usar matrixRows ni matrixColumns.`,
                    );
                }
            }
        }

        for (const q of questions) {
            if (!q.dependsOnQuestionId) continue;

            if (!['single', 'multiple'].includes(q.type)) {
                throw new BadRequestException(
                    `La pregunta "${q.text}" con dependencia debe ser tipo single o multiple.`,
                );
            }

            const parentQuestion = questions.find((p: any) => p.id === q.dependsOnQuestionId);

            if (!parentQuestion) {
                throw new BadRequestException(
                    `La pregunta "${q.text}" depende de una pregunta inexistente.`,
                );
            }

            if (!['single', 'multiple'].includes(parentQuestion.type)) {
                throw new BadRequestException(
                    `La pregunta "${q.text}" solo puede depender de preguntas tipo single o multiple.`,
                );
            }

            const parentOptions = parentQuestion.options || [];
            const parentOptionIds = new Set(
                parentOptions
                    .filter((o: any) => o?.id?.trim())
                    .map((o: any) => o.id),
            );

            if (!parentOptionIds.size) {
                throw new BadRequestException(
                    `La pregunta padre "${parentQuestion.text}" no tiene opciones válidas.`,
                );
            }

            const childOptions = q.options || [];
            if (!childOptions.length) {
                throw new BadRequestException(
                    `La pregunta dependiente "${q.text}" debe tener opciones.`,
                );
            }

            for (const opt of childOptions) {
                if (!opt.parentOptionId) {
                    throw new BadRequestException(
                        `La opción "${opt.label}" de la pregunta "${q.text}" debe tener parentOptionId.`,
                    );
                }

                if (!parentOptionIds.has(opt.parentOptionId)) {
                    throw new BadRequestException(
                        `La opción "${opt.label}" de la pregunta "${q.text}" tiene un parentOptionId inválido.`,
                    );
                }
            }
        }
    }

    findActive(userId: string, updatedSince?: string) {
        const q: any = {
            active: true,
            show: { $ne: false },
            $or: [
                { assignedTo: { $exists: false } },
                { assignedTo: { $size: 0 } },
                { assignedTo: userId },
            ],
        };

        if (updatedSince) q.updatedAt = { $gt: new Date(updatedSince) };

        return this.model.find(q).lean().exec();
    }

    findActive_web(updatedSince?: string) {
        const q: any = {
            active: true
        };

        if (updatedSince) q.updatedAt = { $gt: new Date(updatedSince) };

        return this.model.find(q).lean().exec();
    }

    findOne(formId: string) {
        return this.model
            .findOne({ formId, active: true, show: { $ne: false } })
            .lean()
            .exec();
    }

    async create(dto: any) {
        this.validateQuestions(dto.questions);
        return this.model.create(dto);
    }

    async update(formId: string, dto: any) {
        if (dto.questions) {
            this.validateQuestions(dto.questions);
        }

        return this.model
            .findOneAndUpdate({ formId }, { $set: dto }, { new: true, upsert: false })
            .lean()
            .exec();
    }

    async updateById(id: string, dto: any) {
        if (dto.questions) {
            this.validateQuestions(dto.questions);
        }

        return this.model
            .findByIdAndUpdate(id, { $set: dto }, { new: true, upsert: false })
            .lean()
            .exec();
    }

    async deleteById(id: string) {
        return this.model
            .findByIdAndUpdate(id, { active: false }, { new: true, upsert: false })
            .lean()
            .exec();
    }

    async upsert(dto: any) {
        this.validateQuestions(dto.questions);

        return this.model
            .findOneAndUpdate(
                { formId: dto.formId },
                { $set: dto },
                { new: true, upsert: true },
            )
            .lean()
            .exec();
    }

    findPublic(formId: string) {
        return this.model
            .findOne({
                formId,
                active: true,
                show: { $ne: false }
            })
            .lean()
            .exec();
    }

}
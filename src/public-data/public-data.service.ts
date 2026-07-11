import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Form } from '../forms/form.schema';
import { ResponseDoc } from '../responses/response.schema';
import { toCamelCase } from './normalize-variable';

@Injectable()
export class PublicDataService {
    constructor(
        @InjectModel(Form.name)
        private readonly formModel: Model<Form>,
        @InjectModel(ResponseDoc.name)
        private readonly responseModel: Model<ResponseDoc>,
    ) {}

    async getDataDictionary(formId: string): Promise<Record<string, string>> {
        const form = await this.formModel.findOne({ formId }).lean();
        if (!form) throw new NotFoundException(`Formulario ${formId} no encontrado`);

        const dict: Record<string, string> = {};

        for (const q of form.questions) {
            const qId = q.id;

            switch (q.type) {
                case 'open':
                    dict[`${qId}_${toCamelCase(q.text)}`] = q.text;
                    break;

                case 'single':
                    dict[`${qId}_${toCamelCase(q.text)}`] = q.text;
                    if ((q.options || []).some((o: any) => o.hasFollowupText)) {
                        dict[`${qId}_porQue`] = q.text;
                    }
                    if ((q.options || []).some((o: any) => o.isOther)) {
                        dict[`${qId}_otroTexto`] = q.text;
                    }
                    break;

                case 'multiple':
                    for (const opt of q.options || []) {
                        if (opt.isOther) continue;
                        dict[`${qId}_${toCamelCase(opt.label)}`] = q.text;
                    }
                    if ((q.options || []).some((o: any) => o.isOther)) {
                        dict[`${qId}_otroTexto`] = q.text;
                    }
                    break;

                case 'matrix':
                    for (const row of q.matrixRows || []) {
                        dict[`${qId}_${toCamelCase(row.label)}`] = q.text;
                        if (row.isOther) {
                            dict[`${qId}_otrosDescripcion`] = q.text;
                        }
                    }
                    break;

                case 'list':
                    for (const item of q.listItems || []) {
                        const itemKey = `${qId}_${toCamelCase(item.label)}`;
                        if (q.hasValueSelection) {
                            dict[itemKey] = q.text;
                        }
                        dict[`${itemKey}_justification`] = q.text;
                    }
                    break;
            }
        }

        return dict;
    }

    async getResponsesTable(formId: string): Promise<any[]> {
        const form = await this.formModel.findOne({ formId }).lean();
        if (!form) throw new NotFoundException(`Formulario ${formId} no encontrado`);

        const questionsMap = new Map<string, any>();
        for (const q of form.questions) {
            questionsMap.set(q.id, q);
        }

        const responses = await this.responseModel.find({ formId }).lean();

        return responses.map((r: any) => {
            const row: any = {
                responseId: r._id?.toString(),
                formId: r.formId,
                userId: r.userId || '',
                deviceId: r.deviceId || '',
                submittedAt: r.submittedAt,
                geo_lat: r.geo?.lat ?? null,
                geo_lng: r.geo?.lng ?? null,
                geo_accuracy: r.geo?.accuracy ?? null,
            };

            for (const answer of r.answers || []) {
                const question = questionsMap.get(answer.questionId);
                const qId = answer.questionId;
                const qText = answer.questionText || qId;

                switch (answer.type) {
                    case 'open':
                        row[`${qId}_${toCamelCase(qText)}`] = answer.value ?? '';
                        break;

                    case 'single':
                        row[`${qId}_${toCamelCase(qText)}`] = answer.value ?? '';
                        if (answer.followupText) {
                            row[`${qId}_porQue`] = answer.followupText;
                        }
                        if (answer.otherText) {
                            row[`${qId}_otroTexto`] = answer.otherText;
                        }
                        break;

                    case 'multiple':
                        if (question) {
                            const selectedIds = answer.optionIds || [];
                            for (const opt of question.options || []) {
                                if (opt.isOther) continue;
                                row[`${qId}_${toCamelCase(opt.label)}`] = selectedIds.includes(opt.id) ? 1 : 0;
                            }
                        }
                        if (answer.otherText) {
                            row[`${qId}_otroTexto`] = answer.otherText;
                        }
                        break;

                    case 'matrix':
                        for (const ma of answer.matrixAnswers || []) {
                            row[`${qId}_${toCamelCase(ma.rowLabel || ma.rowId)}`] = ma.columnLabel || ma.columnId || '';
                            if ((ma.rowLabel || '').toLowerCase() === 'otros' && ma.otherText) {
                                row[`${qId}_otrosDescripcion`] = ma.otherText;
                            }
                        }
                        break;

                    case 'list':
                        if (question) {
                            const hasVal = question.hasValueSelection;
                            for (const la of answer.listAnswers || []) {
                                const itemKey = `${qId}_${toCamelCase(la.itemLabel || la.itemId)}`;
                                if (hasVal) {
                                    row[itemKey] = la.value ?? null;
                                }
                                row[`${itemKey}_justification`] = la.justification ?? '';
                            }
                        }
                        break;
                }
            }

            return row;
        });
    }
}

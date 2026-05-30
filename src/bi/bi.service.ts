import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { BiQueryDto } from './dto/bi-query.dto';
import { ResponseDoc } from '../responses/response.schema';

// ---------------------------
// helpers
// ---------------------------
function buildDateRange(dateFrom?: string, dateTo?: string) {
    if (!dateFrom && !dateTo) return undefined;

    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : undefined;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : undefined;

    const submittedAt: any = {};
    if (from) submittedAt.$gte = from;
    if (to) submittedAt.$lte = to;

    return submittedAt;
}

function makeNextLink(req: any, nextSkip: number, limit: number) {
    const originalUrl: string = req.originalUrl || req.url || '';
    const [path, qs] = originalUrl.split('?');
    const params = new URLSearchParams(qs || '');
    params.set('skip', String(nextSkip));
    params.set('limit', String(limit));
    return `${path}?${params.toString()}`;
}

@Injectable()
export class BiService {
    constructor(
        @InjectModel(ResponseDoc.name) private readonly responseModel: Model<ResponseDoc>,
    ) { }

    private buildMatch(q: BiQueryDto) {
        const match: any = {};

        // 👇 Requerido para público (evita dump total)
        if (!q.formId) throw new BadRequestException('formId is required');

        match.formId = q.formId;

        // Opcionales
        if (q.userId) match.userId = q.userId;

        const range = buildDateRange(q.dateFrom, q.dateTo);
        if (range) match.submittedAt = range;

        return match;
    }

    // =========================================================
    // PUBLIC: FACT RESPONSES (1 fila por documento)
    // =========================================================
    async publicResponses(q: BiQueryDto, req: any) {
        const match = this.buildMatch(q);
        const skip = q.skip ?? 0;
        const limit = q.limit ?? 5000;

        const docs = await this.responseModel
            .find(match, {
                formId: 1,
                submittedAt: 1,
                geo: 1,
                createdAt: 1,
                updatedAt: 1,

                // 👇 NO exponemos:
                userId: 0,
                deviceId: 0,
                answers: 0,
            } as any)
            .sort({ submittedAt: 1, _id: 1 })
            .skip(skip)
            .limit(limit + 1)
            .lean()
            .exec();

        const hasNext = docs.length > limit;
        const slice = hasNext ? docs.slice(0, limit) : docs;

        const value = slice.map((r: any) => ({
            responseId: String(r._id),
            formId: r.formId,
            submittedAt: r.submittedAt,

            lat: r.geo?.lat ?? null,
            lng: r.geo?.lng ?? null,
            accuracy: r.geo?.accuracy ?? null,
            altitude: r.geo?.altitude ?? null,
            speed: r.geo?.speed ?? null,
            heading: r.geo?.heading ?? null,
            geoTimestamp: r.geo?.timestamp ?? null,

            createdAt: r.createdAt ?? null,
            updatedAt: r.updatedAt ?? null,
        }));

        return {
            value,
            nextLink: hasNext ? makeNextLink(req, skip + limit, limit) : null,
        };
    }

    // =========================================================
    // PUBLIC: FACT ANSWERS (aplanado + explode multiple)
    // - 1 fila por pregunta respondida
    // - multiple => N filas (una por optionLabels)
    // - incluye answerLabel universal para Power BI
    // - NO exponemos userId/deviceId
    // Paginación: por responses (estable)
    // =========================================================
    async publicAnswers(q: BiQueryDto, req: any) {
        const match = this.buildMatch(q);
        const skip = q.skip ?? 0;
        const limit = q.limit ?? 5000;

        // 1) Tomamos IDs de respuestas para paginar estable
        const idsDocs = await this.responseModel
            .find(match, { _id: 1 })
            .sort({ submittedAt: 1, _id: 1 })
            .skip(skip)
            .limit(limit + 1)
            .lean()
            .exec();

        const hasNext = idsDocs.length > limit;
        const pageIds = (hasNext ? idsDocs.slice(0, limit) : idsDocs).map(
            (d: any) => new Types.ObjectId(d._id),
        );

        if (!pageIds.length) {
            return { value: [], nextLink: null };
        }

        const pipeline: any[] = [
            { $match: { _id: { $in: pageIds } } },
            { $sort: { submittedAt: 1, _id: 1 } },

            // OJO: aquí sí usamos datos del doc padre
            {
                $project: {
                    formId: 1,
                    submittedAt: 1,
                    geo: 1,
                    answers: 1,
                },
            },

            { $unwind: '$answers' },

            {
                $project: {
                    _id: 0,
                    responseId: { $toString: '$_id' },
                    formId: 1,
                    submittedAt: 1,

                    // geo por si quieres mapas por pregunta/opción
                    lat: '$geo.lat',
                    lng: '$geo.lng',
                    accuracy: '$geo.accuracy',

                    questionId: '$answers.questionId',
                    questionText: '$answers.questionText',
                    type: '$answers.type',

                    valueText: '$answers.value',
                    optionIds: { $ifNull: ['$answers.optionIds', []] },
                    optionLabels: { $ifNull: ['$answers.optionLabels', []] },
                },
            },

            { $addFields: { hasOptions: { $gt: [{ $size: '$optionLabels' }, 0] } } },

            // zip (optionIds + optionLabels)
            {
                $addFields: {
                    zippedOptions: {
                        $cond: [
                            '$hasOptions',
                            {
                                $map: {
                                    input: { $range: [0, { $size: '$optionLabels' }] },
                                    as: 'i',
                                    in: {
                                        optionLabel: { $arrayElemAt: ['$optionLabels', '$$i'] },
                                        optionId: {
                                            $cond: [
                                                { $gt: [{ $size: '$optionIds' }, 0] },
                                                { $arrayElemAt: ['$optionIds', '$$i'] },
                                                null,
                                            ],
                                        },
                                    },
                                },
                            },
                            [],
                        ],
                    },
                },
            },

            // output: con opciones vs sin opciones
            {
                $facet: {
                    withOptions: [
                        { $match: { hasOptions: true } },
                        { $unwind: '$zippedOptions' },
                        {
                            $project: {
                                responseId: 1,
                                formId: 1,
                                submittedAt: 1,
                                lat: 1,
                                lng: 1,
                                accuracy: 1,
                                questionId: 1,
                                questionText: 1,
                                type: 1,

                                valueText: { $literal: null },
                                optionId: '$zippedOptions.optionId',
                                optionLabel: '$zippedOptions.optionLabel',

                                // Campo universal
                                answerLabel: '$zippedOptions.optionLabel',
                            },
                        },
                    ],
                    noOptions: [
                        { $match: { hasOptions: false } },
                        {
                            $project: {
                                responseId: 1,
                                formId: 1,
                                submittedAt: 1,
                                lat: 1,
                                lng: 1,
                                accuracy: 1,
                                questionId: 1,
                                questionText: 1,
                                type: 1,

                                valueText: { $ifNull: ['$valueText', 'Sin respuesta'] },
                                optionId: { $literal: null },
                                optionLabel: { $literal: null },

                                // Campo universal
                                answerLabel: { $ifNull: ['$valueText', 'Sin respuesta'] },
                            },
                        },
                    ],
                },
            },

            { $project: { value: { $concatArrays: ['$withOptions', '$noOptions'] } } },
            { $unwind: '$value' },
            { $replaceRoot: { newRoot: '$value' } },
        ];

        const value = await this.responseModel.aggregate(pipeline).exec();

        return {
            value,
            nextLink: hasNext ? makeNextLink(req, skip + limit, limit) : null,
        };
    }
}

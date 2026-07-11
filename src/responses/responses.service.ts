import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseDoc } from './response.schema';
import { SearchResponsesDto } from './dto/search-responses.dto';
import { GeneralReportDto } from './dto/general-report.dto';
import { Form } from 'src/forms/form.schema';

@Injectable()
export class ResponsesService {
    constructor(
        @InjectModel(ResponseDoc.name)
        private responseModel: Model<ResponseDoc>,
        @InjectModel(Form.name)
        private readonly formModel: Model<Form>,
    ) { }

    private normalizeAnswer(answer: any) {
        const normalized: any = {
            questionId: answer?.questionId,
            questionText: answer?.questionText,
            type: answer?.type,
        };

        if (answer?.type === 'open' || answer?.type === 'single') {
            normalized.value = answer?.value ?? '';
        }

        if (answer?.type === 'single' || answer?.type === 'multiple') {
            normalized.optionIds = Array.isArray(answer?.optionIds) ? answer.optionIds : [];
            normalized.optionLabels = Array.isArray(answer?.optionLabels) ? answer.optionLabels : [];
            normalized.otherText = answer?.otherText ?? undefined;
            normalized.followupText = answer?.followupText ?? undefined;
        }

        if (answer?.type === 'matrix') {
            normalized.matrixAnswers = Array.isArray(answer?.matrixAnswers)
                ? answer.matrixAnswers.map((item: any) => ({
                    rowId: item?.rowId,
                    rowLabel: item?.rowLabel,
                    columnId: item?.columnId,
                    columnLabel: item?.columnLabel,
                    otherText: item?.otherText,
                }))
                : [];
        }

        if (answer?.type === 'list') {
            normalized.listAnswers = Array.isArray(answer?.listAnswers)
                ? answer.listAnswers.map((item: any) => ({
                    itemId: item?.itemId,
                    itemLabel: item?.itemLabel,
                    value: item?.value ?? null,
                    justification: item?.justification ?? '',
                }))
                : [];
        }

        return normalized;
    }

    private async validateAnswersAgainstForm(formId: string, answers: any[]) {
        const form = await this.formModel.findOne({
            formId,
            active: true,
            show: { $ne: false },
        }).lean();

        if (!form) {
            throw new BadRequestException(`Formulario no encontrado, inactivo o no visible: ${formId}`);
        }

        const questions = Array.isArray(form.questions) ? form.questions : [];

        for (const answer of answers || []) {
            const q = questions.find((qq: any) => qq.id === answer.questionId);

            if (!q) {
                throw new BadRequestException(`Pregunta no encontrada en el formulario: ${answer.questionId}`);
            }

            if (q.type !== answer.type) {
                throw new BadRequestException(
                    `La pregunta ${answer.questionId} espera tipo ${q.type} pero recibió ${answer.type}`,
                );
            }

            if (q.type === 'open') {
                const value = String(answer?.value ?? '').trim();

                if (q.required && !value) {
                    throw new BadRequestException(`La pregunta "${q.text}" es obligatoria.`);
                }

                if (q.maxLength && value.length > q.maxLength) {
                    throw new BadRequestException(
                        `La pregunta "${q.text}" excede el máximo de ${q.maxLength} caracteres.`,
                    );
                }
            }

            if (q.type === 'single' || q.type === 'multiple') {
                const selectedOptionIds = Array.isArray(answer.optionIds) ? answer.optionIds : [];
                const allOptions = Array.isArray(q.options) ? q.options : [];
                const validOptionIds = new Set(allOptions.map((opt: any) => opt.id));

                if (q.type === 'single') {
                    if (q.required && selectedOptionIds.length === 0) {
                        throw new BadRequestException(`La pregunta "${q.text}" es obligatoria.`);
                    }

                    if (selectedOptionIds.length > 1) {
                        throw new BadRequestException(
                            `La pregunta "${q.text}" solo permite una opción.`,
                        );
                    }
                }

                if (q.type === 'multiple') {
                    if (q.required && selectedOptionIds.length === 0) {
                        throw new BadRequestException(`La pregunta "${q.text}" es obligatoria.`);
                    }

                    if (
                        q.minSelections != null &&
                        selectedOptionIds.length < q.minSelections
                    ) {
                        throw new BadRequestException(
                            `La pregunta "${q.text}" requiere al menos ${q.minSelections} selección(es).`,
                        );
                    }

                    if (
                        q.maxSelections != null &&
                        selectedOptionIds.length > q.maxSelections
                    ) {
                        throw new BadRequestException(
                            `La pregunta "${q.text}" excede el máximo de selecciones permitidas.`,
                        );
                    }
                }

                for (const optionId of selectedOptionIds) {
                    if (!validOptionIds.has(optionId)) {
                        throw new BadRequestException(
                            `La opción ${optionId} no existe en la pregunta "${q.text}".`,
                        );
                    }
                }

                const selectedOptions = allOptions.filter((opt: any) =>
                    selectedOptionIds.includes(opt.id),
                );

                for (const opt of selectedOptions) {
                    if (opt.isOther && opt.otherRequired && !answer?.otherText?.trim()) {
                        throw new BadRequestException(
                            `La opción "${opt.label}" requiere especificación en la pregunta "${q.text}".`,
                        );
                    }

                    if (
                        opt.isOther &&
                        opt.otherMaxLength &&
                        String(answer?.otherText ?? '').trim().length > opt.otherMaxLength
                    ) {
                        throw new BadRequestException(
                            `La especificación de la opción "${opt.label}" excede el máximo de ${opt.otherMaxLength} caracteres en la pregunta "${q.text}".`,
                        );
                    }

                    if (
                        opt.hasFollowupText &&
                        opt.followupRequired &&
                        !answer?.followupText?.trim()
                    ) {
                        throw new BadRequestException(
                            `La opción "${opt.label}" requiere texto adicional en la pregunta "${q.text}".`,
                        );
                    }

                    if (
                        opt.hasFollowupText &&
                        opt.followupMaxLength &&
                        String(answer?.followupText ?? '').trim().length > opt.followupMaxLength
                    ) {
                        throw new BadRequestException(
                            `El texto adicional de la opción "${opt.label}" excede el máximo de ${opt.followupMaxLength} caracteres en la pregunta "${q.text}".`,
                        );
                    }
                }
            }

            if (q.type === 'matrix') {
                const matrixAnswers = Array.isArray(answer.matrixAnswers) ? answer.matrixAnswers : [];

                const validRows = new Map((q.matrixRows || []).map((r: any) => [r.id, r]));
                const validCols = new Map((q.matrixColumns || []).map((c: any) => [c.id, c]));

                if (!matrixAnswers.length && q.required) {
                    throw new BadRequestException(`La pregunta matrix "${q.text}" es obligatoria.`);
                }

                if (q.maxRowsToAnswer && matrixAnswers.length > q.maxRowsToAnswer) {
                    throw new BadRequestException(
                        `La pregunta matrix "${q.text}" excede el máximo de filas permitidas.`,
                    );
                }

                const seenRows = new Set<string>();

                for (const item of matrixAnswers) {
                    if (!item?.rowId || !validRows.has(item.rowId)) {
                        throw new BadRequestException(
                            `Fila inválida en pregunta matrix "${q.text}": ${item?.rowId}`,
                        );
                    }

                    if (!item?.columnId || !validCols.has(item.columnId)) {
                        throw new BadRequestException(
                            `Columna inválida en pregunta matrix "${q.text}": ${item?.columnId}`,
                        );
                    }

                    if (seenRows.has(item.rowId)) {
                        throw new BadRequestException(
                            `La fila ${item.rowId} está repetida en la pregunta matrix "${q.text}".`,
                        );
                    }

                    seenRows.add(item.rowId);

                    const row: any = validRows.get(item.rowId);

                    if (row?.isOther && row?.otherRequired && !item?.otherText?.trim()) {
                        throw new BadRequestException(
                            `La fila "${row.label}" requiere especificación en la pregunta "${q.text}".`,
                        );
                    }

                    if (
                        row?.isOther &&
                        row?.otherMaxLength &&
                        String(item?.otherText ?? '').trim().length > row.otherMaxLength
                    ) {
                        throw new BadRequestException(
                            `La especificación de la fila "${row.label}" excede el máximo de ${row.otherMaxLength} caracteres en la pregunta "${q.text}".`,
                        );
                    }
                }
            }

            if (q.type === 'list') {
                const listAnswers = Array.isArray(answer.listAnswers) ? answer.listAnswers : [];
                const validItems = new Map<string, any>((q.listItems || []).map((i: any) => [i.id, i]));

                if (q.required && !listAnswers.length) {
                    throw new BadRequestException(`La pregunta lista "${q.text}" es obligatoria.`);
                }

                if (q.required && listAnswers.length < validItems.size) {
                    throw new BadRequestException(
                        `Debes responder todos los items en la pregunta "${q.text}".`,
                    );
                }

                const seenItems = new Set<string>();

                for (const item of listAnswers) {
                    if (!item?.itemId || !validItems.has(item.itemId)) {
                        throw new BadRequestException(
                            `Item inválido en pregunta lista "${q.text}": ${item?.itemId}`,
                        );
                    }

                    if (seenItems.has(item.itemId)) {
                        throw new BadRequestException(
                            `El item ${item.itemId} está repetido en la pregunta "${q.text}".`,
                        );
                    }
                    seenItems.add(item.itemId);

                    if (q.hasValueSelection && item.value == null) {
                        const itemDef = validItems.get(item.itemId);
                        throw new BadRequestException(
                            `Debes seleccionar SI o NO para "${itemDef?.label}" en la pregunta "${q.text}".`,
                        );
                    }

                    if (q.required && !String(item?.justification ?? '').trim()) {
                        const itemDef = validItems.get(item.itemId);
                        throw new BadRequestException(
                            `Debes justificar tu respuesta para "${itemDef?.label}" en la pregunta "${q.text}".`,
                        );
                    }
                }
            }
        }
    }

    async createMany(items: Partial<ResponseDoc>[]) {
        const normalizedItems: any[] = [];

        for (const item of items) {
            const answers = Array.isArray(item.answers)
                ? item.answers.map(a => this.normalizeAnswer(a))
                : [];

            await this.validateAnswersAgainstForm(item.formId as string, answers);

            normalizedItems.push({
                ...item,
                answers,
            });
        }

        return this.responseModel.insertMany(normalizedItems);
    }

    findByUser(userId: string) {
        return this.responseModel.find({ userId }).lean().exec();
    }

    async search(dto: SearchResponsesDto) {
        const {
            formId,
            userId,
            dateFrom,
            dateTo,
            page = 1,
            pageSize = 10,
        } = dto;

        const query: any = {};

        if (formId) query.formId = formId;
        if (userId) query.userId = userId;

        if (dateFrom || dateTo) {
            const from = dateFrom ? new Date(dateFrom + 'T00:00:00') : undefined;
            const to = dateTo ? new Date(dateTo + 'T23:59:59') : undefined;
            query.submittedAt = {};
            if (from) query.submittedAt.$gte = from;
            if (to) query.submittedAt.$lte = to;
        }

        const skip = (page - 1) * pageSize;

        const [items, total] = await Promise.all([
            this.responseModel
                .find(query)
                .sort({ submittedAt: -1 })
                .skip(skip)
                .limit(pageSize)
                .lean()
                .exec(),
            this.responseModel.countDocuments(query),
        ]);

        return { items, total };
    }

    async getGeneralReport(formId: string): Promise<GeneralReportDto> {
        const [agg] = await this.responseModel.aggregate([
            { $match: { formId } },
            {
                $facet: {
                    total: [{ $count: 'value' }],

                    victims: [
                        { $unwind: '$answers' },
                        { $match: { 'answers.questionId': 'q31' } },
                        {
                            $project: {
                                v: {
                                    $toLower: { $ifNull: ['$answers.value', ''] },
                                },
                            },
                        },
                        { $match: { v: 'sí' } },
                        { $count: 'value' },
                    ],

                    insecure: [
                        { $unwind: '$answers' },
                        { $match: { 'answers.questionId': 'q18' } },
                        { $project: { v: '$answers.value' } },
                        {
                            $match: {
                                v: { $in: ['Inseguro', 'Muy inseguro'] },
                            },
                        },
                        { $count: 'value' },
                    ],

                    byParish: [
                        { $unwind: '$answers' },
                        { $match: { 'answers.questionId': 'q1' } },
                        {
                            $group: {
                                _id: '$answers.value',
                                count: { $sum: 1 },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                parish: '$_id',
                                count: 1,
                            },
                        },
                        { $sort: { count: -1 } },
                    ],

                    byDate: [
                        {
                            $group: {
                                _id: {
                                    $dateToString: {
                                        format: '%Y-%m-%d',
                                        date: '$submittedAt',
                                        timezone: 'America/Guayaquil',
                                    },
                                },
                                count: { $sum: 1 },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                date: '$_id',
                                count: 1,
                            },
                        },
                        { $sort: { date: 1 } },
                    ],

                    securityLevels: [
                        { $unwind: '$answers' },
                        { $match: { 'answers.questionId': 'q18' } },
                        {
                            $group: {
                                _id: '$answers.value',
                                count: { $sum: 1 },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                label: '$_id',
                                count: 1,
                            },
                        },
                        { $sort: { count: -1 } },
                    ],

                    reported: [
                        { $unwind: '$answers' },
                        { $match: { 'answers.questionId': 'q33' } },
                        {
                            $project: {
                                v: {
                                    $toLower: { $ifNull: ['$answers.value', ''] },
                                },
                            },
                        },
                        { $match: { v: 'sí' } },
                        { $count: 'value' },
                    ],

                    crimes: [
                        { $unwind: '$answers' },
                        { $match: { 'answers.questionId': 'q32' } },
                        {
                            $project: {
                                labels: {
                                    $ifNull: ['$answers.optionLabels', []],
                                },
                            },
                        },
                        { $unwind: '$labels' },
                        {
                            $group: {
                                _id: '$labels',
                                count: { $sum: 1 },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                label: '$_id',
                                count: 1,
                            },
                        },
                        { $sort: { count: -1 } },
                    ],

                    noReportReasons: [
                        { $unwind: '$answers' },
                        { $match: { 'answers.questionId': 'q34' } },
                        {
                            $project: {
                                labels: {
                                    $ifNull: ['$answers.optionLabels', []],
                                },
                            },
                        },
                        { $unwind: '$labels' },
                        {
                            $group: {
                                _id: '$labels',
                                count: { $sum: 1 },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                label: '$_id',
                                count: 1,
                            },
                        },
                        { $sort: { count: -1 } },
                    ],
                },
            },
        ]);

        const total = agg?.total?.[0]?.value ?? 0;
        const victimsCount = agg?.victims?.[0]?.value ?? 0;
        const insecureCount = agg?.insecure?.[0]?.value ?? 0;
        const parroquiasCount = agg?.byParish?.length ?? 0;
        const reportedCount = agg?.reported?.[0]?.value ?? 0;

        const kpis = [
            { label: 'Total encuestas', value: total },
            {
                label: '% víctimas 12 meses',
                value: total ? (victimsCount * 100) / total : 0,
                hint: 'q31 = "Sí"',
            },
            {
                label: '% se siente inseguro',
                value: total ? (insecureCount * 100) / total : 0,
                hint: 'q18 = Inseguro / Muy inseguro',
            },
            { label: 'Parroquias con encuestas', value: parroquiasCount },
        ];

        const victimsRate = total ? (victimsCount * 100) / total : 0;
        const reportedRate = victimsCount ? (reportedCount * 100) / victimsCount : 0;

        const crimes = agg.crimes ?? [];
        const noReportReasons = agg.noReportReasons ?? [];

        const victimization = {
            victimsCount,
            victimsRate,
            reportedCount,
            reportedRate,
            mainCrimes: crimes,
            noReportReasons,
        };

        return {
            kpis,
            byParish: agg.byParish ?? [],
            byDate: agg.byDate ?? [],
            securityLevels: agg.securityLevels ?? [],
            victimization,
        };
    }

    async getQuestionStats(
        formId: string,
        questionId: string,
    ): Promise<{
        formId: string;
        questionId: string;
        questionText: string;
        totalAnswers: number;
        items: { label: string; count: number }[];
    }> {
        const form = await this.formModel.findOne({ formId }).lean();
        const q = form?.questions?.find((qq: any) => qq.id === questionId);
        const questionText = q?.text ?? questionId;
        const questionType = q?.type ?? 'open';

        if (questionType === 'list') {
            const hasValueSelection = q?.hasValueSelection ?? false;

            const labelExpr = hasValueSelection
                ? {
                    $concat: [
                        { $ifNull: ['$listAnswers.itemLabel', '$listAnswers.itemId'] },
                        ' → ',
                        { $cond: [{ $eq: ['$listAnswers.value', true] }, 'Sí', 'No'] },
                    ],
                }
                : { $ifNull: ['$listAnswers.itemLabel', '$listAnswers.itemId'] };

            const agg = await this.responseModel.aggregate([
                { $match: { formId } },
                { $unwind: '$answers' },
                { $match: { 'answers.questionId': questionId } },
                { $project: { listAnswers: { $ifNull: ['$answers.listAnswers', []] } } },
                { $unwind: '$listAnswers' },
                { $project: { label: labelExpr } },
                { $group: { _id: '$label', count: { $sum: 1 } } },
                { $sort: { count: -1, _id: 1 } },
            ]);

            const totalAnswers = agg.reduce((acc, it) => acc + (it.count || 0), 0);
            const items = agg.map((it) => ({
                label: it._id ?? 'Sin respuesta',
                count: it.count || 0,
            }));

            return { formId, questionId, questionText, totalAnswers, items };
        }

        if (questionType === 'matrix') {
            const agg = await this.responseModel.aggregate([
                { $match: { formId } },
                { $unwind: '$answers' },
                { $match: { 'answers.questionId': questionId } },
                {
                    $project: {
                        matrixAnswers: { $ifNull: ['$answers.matrixAnswers', []] },
                    },
                },
                { $unwind: '$matrixAnswers' },
                {
                    $project: {
                        label: {
                            $concat: [
                                { $ifNull: ['$matrixAnswers.rowLabel', '$matrixAnswers.rowId'] },
                                ' → ',
                                { $ifNull: ['$matrixAnswers.columnLabel', '$matrixAnswers.columnId'] },
                            ],
                        },
                    },
                },
                {
                    $group: {
                        _id: '$label',
                        count: { $sum: 1 },
                    },
                },
                { $sort: { count: -1, _id: 1 } },
            ]);

            const totalAnswers = agg.reduce((acc, it) => acc + (it.count || 0), 0);
            const items = agg.map((it) => ({
                label: it._id ?? 'Sin respuesta',
                count: it.count || 0,
            }));

            return {
                formId,
                questionId,
                questionText,
                totalAnswers,
                items,
            };
        }

        const pipeline: any = [
            { $match: { formId } },
            { $unwind: '$answers' },
            { $match: { 'answers.questionId': questionId } },
            {
                $project: {
                    labels: '$answers.optionLabels',
                    value: '$answers.value',
                },
            },
            {
                $project: {
                    labelArray: {
                        $cond: [
                            { $gt: [{ $size: { $ifNull: ['$labels', []] } }, 0] },
                            '$labels',
                            [{ $ifNull: ['$value', 'Sin respuesta'] }],
                        ],
                    },
                },
            },
            { $unwind: '$labelArray' },
            {
                $group: {
                    _id: '$labelArray',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
        ];

        const agg = await this.responseModel.aggregate(pipeline);

        const totalAnswers = agg.reduce((acc, it) => acc + (it.count || 0), 0);
        const items = agg.map((it) => ({
            label: it._id ?? 'Sin respuesta',
            count: it.count || 0,
        }));

        return {
            formId,
            questionId,
            questionText,
            totalAnswers,
            items,
        };
    }

    /* async getAllByFormId(formId: string): Promise<{
        formId: string;
        total: number;
        items: any[];
    }> {
        if (!formId?.trim()) {
            throw new BadRequestException('formId es requerido');
        }

        const items = await this.responseModel
            .find({ formId })
            .sort({ submittedAt: -1 })
            .lean()
            .exec();

        const mapped = items.map((item: any) => {
            const flatAnswers: Record<string, any> = {};
            const normalizedAnswers = (item.answers ?? []).map((answer: any) => {
                let normalizedValue: any = null;

                if (answer.type === 'open') {
                    normalizedValue = answer.value ?? null;
                } else if (answer.type === 'single') {
                    normalizedValue =
                        answer.value ??
                        (Array.isArray(answer.optionLabels) && answer.optionLabels.length
                            ? answer.optionLabels[0]
                            : null);
                } else if (answer.type === 'multiple') {
                    normalizedValue = Array.isArray(answer.optionLabels)
                        ? answer.optionLabels
                        : [];
                } else if (answer.type === 'matrix') {
                    normalizedValue = Array.isArray(answer.matrixAnswers)
                        ? answer.matrixAnswers.map((m: any) => ({
                            rowId: m.rowId,
                            rowLabel: m.rowLabel,
                            columnId: m.columnId,
                            columnLabel: m.columnLabel,
                            otherText: m.otherText ?? null,
                        }))
                        : [];
                }

                // Estructura plana para dashboards
                if (answer.type === 'matrix') {
                    flatAnswers[answer.questionId] = normalizedValue;

                    // además desglosamos por fila para graficar más fácil
                    for (const row of normalizedValue ?? []) {
                        flatAnswers[`${answer.questionId}__${row.rowId}`] =
                            row.columnLabel ?? row.columnId ?? null;
                    }
                } else {
                    flatAnswers[answer.questionId] = normalizedValue;
                }

                // también guardar por texto de pregunta cuando exista
                if (answer.questionText) {
                    flatAnswers[`text__${answer.questionId}`] = answer.questionText;
                }

                return {
                    questionId: answer.questionId,
                    questionText: answer.questionText,
                    type: answer.type,
                    value: normalizedValue,
                    raw: answer,
                };
            });

            return {
                id: String(item._id),
                formId: item.formId,
                submittedAt: item.submittedAt,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                deviceId: item.deviceId,
                userId: item.userId,
                geo: item.geo,
                answers: item.answers ?? [],
                flatAnswers,
                normalizedAnswers,
            };
        });

        return {
            formId,
            total: mapped.length,
            items: mapped,
        };
    } */

    async getAllByFormId(formId: string): Promise<{
        formId: string;
        total: number;
        items: any[];
    }> {
        if (!formId?.trim()) {
            throw new BadRequestException('formId es requerido');
        }

        // 🔥 Traer solo campos necesarios (MEJOR PERFORMANCE)
        const items = await this.responseModel
            .find({ formId })
            .select({
                formId: 1,
                submittedAt: 1,
                createdAt: 1,
                deviceId: 1,
                userId: 1,
                geo: 1,
                answers: 1, // necesario para construir flat
            })
            .sort({ submittedAt: -1 })
            .lean()
            .exec();

        const mapped = items.map((item: any) => {
            const flatAnswers: Record<string, any> = {};

            for (const answer of item.answers ?? []) {
                let value: any = null;

                if (answer.type === 'open') {
                    value = answer.value ?? null;

                } else if (answer.type === 'single') {
                    value =
                        answer.value ??
                        (answer.optionLabels?.[0] ?? null);

                } else if (answer.type === 'multiple') {
                    value = answer.optionLabels ?? [];

                } else if (answer.type === 'matrix') {
                    const matrix = answer.matrixAnswers ?? [];

                    flatAnswers[answer.questionId] = matrix;

                    for (const row of matrix) {
                        flatAnswers[`${answer.questionId}__${row.rowId}`] =
                            row.columnLabel ?? row.columnId ?? null;
                    }

                    continue;

                } else if (answer.type === 'list') {
                    const list = answer.listAnswers ?? [];

                    flatAnswers[answer.questionId] = list;

                    for (const item of list) {
                        const val = item.value != null
                            ? `${item.value ? 'Sí' : 'No'}: ${item.justification ?? ''}`
                            : item.justification ?? '';
                        flatAnswers[`${answer.questionId}__${item.itemId}`] = val;
                    }

                    continue;
                }

                flatAnswers[answer.questionId] = value;
            }

            return {
                id: String(item._id),
                formId: item.formId,
                submittedAt: item.submittedAt,
                deviceId: item.deviceId,
                userId: item.userId,
                geo: item.geo,
                flatAnswers, // 🔥 SOLO LO QUE NECESITAS
            };
        });

        return {
            formId,
            total: mapped.length,
            items: mapped,
        };
    }

    async getDashboardByFormId(formId: string) {
        if (!formId?.trim()) throw new BadRequestException('formId es requerido');

        const [form, docs] = await Promise.all([
            this.formModel.findOne({ formId }).select({ title: 1, questions: 1 }).lean().exec(),
            this.responseModel.find({ formId }).select({ answers: 1 }).lean().exec(),
        ]);

        const questions = (form?.questions ?? []).map((q: any) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            options: (q.options ?? []).map((o: any) => ({ id: o.id, label: o.label })),
            ...(q.type === 'matrix' && {
                matrixRows: (q.matrixRows ?? []).map((r: any) => ({ id: r.id, label: r.label })),
                matrixColumns: (q.matrixColumns ?? []).map((c: any) => ({ id: c.id, label: c.label })),
            }),
            ...(q.type === 'list' && {
                listItems: (q.listItems ?? []).map((i: any) => ({ id: i.id, label: i.label })),
                hasValueSelection: q.hasValueSelection ?? false,
            }),
        }));

        const responses: any[] = [];
        for (const doc of docs) {
            const responseId = String(doc._id);
            for (const a of doc.answers ?? []) {
                const entry: any = {
                    responseId,
                    questionId: a.questionId,
                    questionText: a.questionText ?? null,
                    type: a.type,
                };
                if (a.value !== undefined) entry.value = a.value;
                if (a.optionIds?.length) entry.optionIds = a.optionIds;
                if (a.optionLabels?.length) entry.optionLabels = a.optionLabels;
                if (a.matrixAnswers?.length) entry.matrixAnswers = a.matrixAnswers;
                if (a.listAnswers?.length) entry.listAnswers = a.listAnswers;
                if (a.followupText) entry.followupText = a.followupText;
                if (a.otherText) entry.otherText = a.otherText;
                responses.push(entry);
            }
        }

        return {
            formId,
            title: form?.title ?? null,
            total: docs.length,
            questions,
            responses,
        };
    }

    /* PUBLIC */
    async createPublicResponse(payload: {
        formId: string;
        answers: Record<string, any>;
        geo?: any;
        submittedAt?: string | Date;
        deviceId?: string;
        userId?: string | null;
    }) {
        const { formId, answers, geo, submittedAt, deviceId, userId } = payload;

        if (!formId?.trim()) {
            throw new BadRequestException('formId es requerido');
        }

        if (!answers || typeof answers !== 'object') {
            throw new BadRequestException('answers es requerido');
        }

        const form: any = await this.formModel.findOne({
            formId,
            active: true,
            show: { $ne: false }
        }).lean();

        if (!form) {
            throw new BadRequestException(
                'Formulario no encontrado, inactivo o no público',
            );
        }

        const questions = Array.isArray(form.questions) ? form.questions : [];
        const normalizedAnswers: any[] = [];

        for (const q of questions) {
            const rawValue = answers[q.id];

            // OPEN
            if (q.type === 'open') {
                const value = rawValue != null ? String(rawValue) : '';

                if (q.required && !value.trim()) {
                    throw new BadRequestException(
                        `La pregunta "${q.text}" es obligatoria.`,
                    );
                }

                if (!value.trim() && !q.required) {
                    continue;
                }

                normalizedAnswers.push({
                    questionId: q.id,
                    questionText: q.text,
                    type: 'open',
                    value,
                });

                continue;
            }

            // SINGLE
            if (q.type === 'single') {
                const selectedId = rawValue != null ? String(rawValue) : '';

                if (q.required && !selectedId) {
                    throw new BadRequestException(
                        `La pregunta "${q.text}" es obligatoria.`,
                    );
                }

                if (!selectedId) {
                    continue;
                }

                const option = (q.options ?? []).find((o: any) => o.id === selectedId);

                if (!option) {
                    throw new BadRequestException(
                        `La opción seleccionada no existe en la pregunta "${q.text}".`,
                    );
                }

                const otherText = answers[`${q.id}__other`] ?? '';
                const followupText = answers[`${q.id}__followup`] ?? '';

                if (option.isOther && option.otherRequired && !String(otherText).trim()) {
                    throw new BadRequestException(
                        `La opción "${option.label}" requiere especificación en la pregunta "${q.text}".`,
                    );
                }

                if (
                    option.hasFollowupText &&
                    option.followupRequired &&
                    !String(followupText).trim()
                ) {
                    throw new BadRequestException(
                        `La opción "${option.label}" requiere texto adicional en la pregunta "${q.text}".`,
                    );
                }

                normalizedAnswers.push({
                    questionId: q.id,
                    questionText: q.text,
                    type: 'single',
                    value: option.label ?? selectedId,
                    optionIds: [option.id],
                    optionLabels: [option.label ?? option.id],
                    ...(option.isOther
                        ? { otherText: String(otherText ?? '') }
                        : {}),
                    ...(option.hasFollowupText
                        ? { followupText: String(followupText ?? '') }
                        : {}),
                });

                continue;
            }

            // MULTIPLE
            if (q.type === 'multiple') {
                const selectedIds = Array.isArray(rawValue)
                    ? rawValue.map((v: any) => String(v))
                    : [];

                if (q.required && selectedIds.length === 0) {
                    throw new BadRequestException(
                        `La pregunta "${q.text}" es obligatoria.`,
                    );
                }

                if (!selectedIds.length) {
                    continue;
                }

                if (q.minSelections != null && selectedIds.length < q.minSelections) {
                    throw new BadRequestException(
                        `La pregunta "${q.text}" requiere al menos ${q.minSelections} selección(es).`,
                    );
                }

                if (q.maxSelections != null && selectedIds.length > q.maxSelections) {
                    throw new BadRequestException(
                        `La pregunta "${q.text}" excede el máximo de selecciones permitidas.`,
                    );
                }

                const selectedOptions = (q.options ?? []).filter((o: any) =>
                    selectedIds.includes(o.id),
                );

                if (selectedOptions.length !== selectedIds.length) {
                    throw new BadRequestException(
                        `Hay opciones inválidas en la pregunta "${q.text}".`,
                    );
                }

                const otherText = answers[`${q.id}__other`] ?? '';
                const followupText = answers[`${q.id}__followup`] ?? '';

                const requiresOther = selectedOptions.some(
                    (o: any) => o.isOther && o.otherRequired,
                );
                const requiresFollowup = selectedOptions.some(
                    (o: any) => o.hasFollowupText && o.followupRequired,
                );

                if (requiresOther && !String(otherText).trim()) {
                    throw new BadRequestException(
                        `Debes especificar el texto en "Otro" para la pregunta "${q.text}".`,
                    );
                }

                if (requiresFollowup && !String(followupText).trim()) {
                    throw new BadRequestException(
                        `Debes completar el texto adicional en la pregunta "${q.text}".`,
                    );
                }

                normalizedAnswers.push({
                    questionId: q.id,
                    questionText: q.text,
                    type: 'multiple',
                    optionIds: selectedOptions.map((o: any) => o.id),
                    optionLabels: selectedOptions.map((o: any) => o.label ?? o.id),
                    ...(selectedOptions.some((o: any) => o.isOther)
                        ? { otherText: String(otherText ?? '') }
                        : {}),
                    ...(selectedOptions.some((o: any) => o.hasFollowupText)
                        ? { followupText: String(followupText ?? '') }
                        : {}),
                });

                continue;
            }

            // MATRIX
            if (q.type === 'matrix') {
                const matrixAnswers = Array.isArray(rawValue) ? rawValue : [];

                if (q.required && matrixAnswers.length === 0) {
                    throw new BadRequestException(
                        `La pregunta "${q.text}" es obligatoria.`,
                    );
                }

                if (!matrixAnswers.length) {
                    continue;
                }

                const validRows = new Map(
                    (q.matrixRows ?? []).map((r: any) => [r.id, r]),
                );
                const validCols = new Map(
                    (q.matrixColumns ?? []).map((c: any) => [c.id, c]),
                );

                const normalizedMatrix = matrixAnswers.map((item: any) => {
                    const row: any = validRows.get(item.rowId);
                    const col: any = validCols.get(item.columnId);

                    if (!row) {
                        throw new BadRequestException(
                            `Fila inválida en la pregunta "${q.text}".`,
                        );
                    }

                    if (!col) {
                        throw new BadRequestException(
                            `Columna inválida en la pregunta "${q.text}".`,
                        );
                    }

                    if (
                        row.isOther &&
                        row.otherRequired &&
                        !String(item.otherText ?? '').trim()
                    ) {
                        throw new BadRequestException(
                            `La fila "${row.label}" requiere especificación en la pregunta "${q.text}".`,
                        );
                    }

                    return {
                        rowId: row.id,
                        rowLabel: row.label,
                        columnId: col.id,
                        columnLabel: col.label,
                        otherText: item.otherText ?? '',
                    };
                });

                normalizedAnswers.push({
                    questionId: q.id,
                    questionText: q.text,
                    type: 'matrix',
                    matrixAnswers: normalizedMatrix,
                });

                continue;
            }

            // LIST
            if (q.type === 'list') {
                const listAnswers = Array.isArray(rawValue) ? rawValue : [];

                if (q.required && listAnswers.length === 0) {
                    throw new BadRequestException(
                        `La pregunta "${q.text}" es obligatoria.`,
                    );
                }

                if (!listAnswers.length) {
                    continue;
                }

                const validItems = new Map(
                    (q.listItems ?? []).map((i: any) => [i.id, i]),
                );

                if (q.required && listAnswers.length < validItems.size) {
                    throw new BadRequestException(
                        `Debes responder todos los items en la pregunta "${q.text}".`,
                    );
                }

                const normalizedList = listAnswers.map((item: any) => {
                    const itemDef: any = validItems.get(item.itemId);

                    if (!itemDef) {
                        throw new BadRequestException(
                            `Item inválido en la pregunta "${q.text}".`,
                        );
                    }

                    if (q.hasValueSelection && item.value == null) {
                        throw new BadRequestException(
                            `Debes seleccionar SI o NO para "${itemDef.label}" en la pregunta "${q.text}".`,
                        );
                    }

                    if (q.required && !String(item.justification ?? '').trim()) {
                        throw new BadRequestException(
                            `Debes justificar tu respuesta para "${itemDef.label}" en la pregunta "${q.text}".`,
                        );
                    }

                    return {
                        itemId: itemDef.id,
                        itemLabel: itemDef.label,
                        value: q.hasValueSelection ? !!item.value : null,
                        justification: String(item.justification ?? ''),
                    };
                });

                normalizedAnswers.push({
                    questionId: q.id,
                    questionText: q.text,
                    type: 'list',
                    listAnswers: normalizedList,
                });
            }
        }

        await this.validateAnswersAgainstForm(formId, normalizedAnswers);

        const doc = await this.responseModel.create({
            formId,
            submittedAt: submittedAt ? new Date(submittedAt) : new Date(),
            deviceId: deviceId ?? 'public-web',
            userId: userId ?? null,
            answers: normalizedAnswers,
            ...(geo && {
                geo: {
                    ...geo,
                    timestamp: geo.timestamp ? new Date(geo.timestamp) : undefined,
                },
            }),
        });

        return doc;
    }

}
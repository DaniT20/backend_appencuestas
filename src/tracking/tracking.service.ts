import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ResponseDoc } from '../responses/response.schema';
import { User } from '../users/user.schema';
import { Parish } from '../parishes/parish.schema';
import { TrackingQueryDto } from './dto/tracking-query.dto';

const TZ = 'America/Guayaquil';

function getTodayStart(): Date {
    const nowUtc = new Date();
    const offsetMs = -5 * 60 * 60 * 1000; // UTC-5 Guayaquil
    const nowLocal = new Date(nowUtc.getTime() + offsetMs);
    const startLocal = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate());
    return new Date(startLocal.getTime() - offsetMs);
}

function buildDateRange(dateFrom?: string, dateTo?: string) {
    if (!dateFrom && !dateTo) return undefined;
    const range: any = {};
    if (dateFrom) range.$gte = new Date(`${dateFrom}T00:00:00`);
    if (dateTo) range.$lte = new Date(`${dateTo}T23:59:59`);
    return range;
}

@Injectable()
export class TrackingService {
    constructor(
        @InjectModel(ResponseDoc.name) private readonly responseModel: Model<ResponseDoc>,
        @InjectModel(User.name) private readonly userModel: Model<User>,
        @InjectModel(Parish.name) private readonly parishModel: Model<Parish>,
    ) {}

    async getDashboard(dto: TrackingQueryDto) {
        const match: any = {};
        if (dto.formId) match.formId = dto.formId;
        const range = buildDateRange(dto.dateFrom, dto.dateTo);
        if (range) match.submittedAt = range;

        const todayStart = getTodayStart();
        const inactiveDays = dto.inactiveDays ?? 3;
        const inactiveThreshold = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000);

        const [agg, enumerators] = await Promise.all([
            this.responseModel.aggregate([
                { $match: match },
                {
                    $facet: {
                        totalResponses: [{ $count: 'value' }],
                        todayResponses: [
                            { $match: { submittedAt: { $gte: todayStart } } },
                            { $count: 'value' },
                        ],
                        byEnumerator: [
                            {
                                $group: {
                                    _id: '$userId',
                                    total: { $sum: 1 },
                                    lastSubmission: { $max: '$submittedAt' },
                                    todayCount: {
                                        $sum: {
                                            $cond: [
                                                { $gte: ['$submittedAt', todayStart] },
                                                1,
                                                0,
                                            ],
                                        },
                                    },
                                },
                            },
                            { $sort: { lastSubmission: -1 } },
                        ],
                        byDate: [
                            {
                                $group: {
                                    _id: {
                                        $dateToString: {
                                            format: '%Y-%m-%d',
                                            date: '$submittedAt',
                                            timezone: TZ,
                                        },
                                    },
                                    count: { $sum: 1 },
                                },
                            },
                            { $project: { _id: 0, date: '$_id', count: 1 } },
                            { $sort: { date: 1 } },
                        ],
                    },
                },
            ]).exec(),

            this.userModel
                .find({ role: 'enumerator', active: true })
                .select('_id name username')
                .lean()
                .exec(),
        ]);

        const facet = agg[0];
        const totalResponses = facet.totalResponses[0]?.value ?? 0;
        const todayResponses = facet.todayResponses[0]?.value ?? 0;
        const byDate: { date: string; count: number }[] = facet.byDate;

        const responsesByUser = new Map<string, any>();
        for (const entry of facet.byEnumerator) {
            responsesByUser.set(entry._id, entry);
        }

        let activeCount = 0;
        let inactiveCount = 0;

        const enumeratorList = enumerators.map((u: any) => {
            const stats = responsesByUser.get(String(u._id));
            const lastSubmission = stats?.lastSubmission ?? null;
            const isActive = lastSubmission && new Date(lastSubmission) >= inactiveThreshold;
            if (isActive) activeCount++;
            else inactiveCount++;

            return {
                userId: String(u._id),
                name: u.name,
                username: u.username,
                total: stats?.total ?? 0,
                todayCount: stats?.todayCount ?? 0,
                lastSubmission,
                status: isActive ? 'active' : 'inactive',
            };
        });

        return {
            kpis: {
                totalResponses,
                todayResponses,
                activeEnumerators: activeCount,
                inactiveEnumerators: inactiveCount,
            },
            enumerators: enumeratorList,
            byDate,
        };
    }

    async getActivityByEnumerator(dto: TrackingQueryDto) {
        const match: any = {};
        if (dto.formId) match.formId = dto.formId;
        if (dto.userId) match.userId = dto.userId;
        const range = buildDateRange(dto.dateFrom, dto.dateTo);
        if (range) match.submittedAt = range;

        const result = await this.responseModel.aggregate([
            { $match: match },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$submittedAt',
                            timezone: TZ,
                        },
                    },
                    count: { $sum: 1 },
                },
            },
            { $project: { _id: 0, date: '$_id', count: 1 } },
            { $sort: { date: 1 } },
        ]).exec();

        return result;
    }

    async getParishReport(dto: TrackingQueryDto): Promise<{ parroquia: string; count: number; lider: string | null }[]> {
        const match: any = {};
        if (dto.formId) match.formId = dto.formId;
        const range = buildDateRange(dto.dateFrom, dto.dateTo);
        if (range) match.submittedAt = range;

        const [withCounts, allParishes, lideres] = await Promise.all([
            this.responseModel.aggregate([
                { $match: match },
                {
                    $lookup: {
                        from: 'users',
                        let: { uid: '$userId' },
                        pipeline: [
                            { $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$uid'] } } },
                            { $project: { parroquiasEncuesta: 1, _id: 0 } },
                        ],
                        as: 'userInfo',
                    },
                },
                { $unwind: '$userInfo' },
                { $unwind: '$userInfo.parroquiasEncuesta' },
                { $group: { _id: '$userInfo.parroquiasEncuesta', count: { $sum: 1 } } },
                { $project: { _id: 0, parroquia: '$_id', count: 1 } },
            ]).exec() as unknown as { parroquia: string; count: number }[],

            this.parishModel.find().sort({ order: 1, name: 1 }).lean().exec(),

            this.userModel
                .find({ role: 'gestor', lider: true, active: true })
                .select('name parroquiasEncuesta')
                .lean()
                .exec(),
        ]);

        const countMap = new Map(withCounts.map(r => [r.parroquia, r.count]));

        // Build a map: parroquia -> lider name (first match)
        const liderMap = new Map<string, string>();
        for (const u of lideres) {
            for (const p of (u as any).parroquiasEncuesta ?? []) {
                if (!liderMap.has(p)) liderMap.set(p, (u as any).name);
            }
        }

        return allParishes.map(p => ({
            parroquia: p.name,
            count: countMap.get(p.name) ?? 0,
            lider: liderMap.get(p.name) ?? null,
        })).sort((a, b) => b.count - a.count);
    }

    async getGeoPoints(dto: TrackingQueryDto) {
        const match: any = { 'geo.lat': { $exists: true } };
        if (dto.formId) match.formId = dto.formId;
        if (dto.userId) match.userId = dto.userId;
        const range = buildDateRange(dto.dateFrom, dto.dateTo);
        if (range) match.submittedAt = range;

        const docs = await this.responseModel
            .find(match, {
                'geo.lat': 1,
                'geo.lng': 1,
                userId: 1,
                submittedAt: 1,
                formId: 1,
            })
            .sort({ submittedAt: -1 })
            .limit(10000)
            .lean()
            .exec();

        return docs.map((d: any) => ({
            lat: d.geo.lat,
            lng: d.geo.lng,
            userId: d.userId ?? null,
            submittedAt: d.submittedAt,
            formId: d.formId,
        }));
    }
}

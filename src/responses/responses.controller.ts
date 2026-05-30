import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ResponsesService } from './responses.service';
import { SearchResponsesDto } from './dto/search-responses.dto';
import { GeneralReportDto } from './dto/general-report.dto';
import { QuestionStatsDto } from './dto/question-stats.dto';

@UseGuards(JwtAuthGuard)
@Controller('responses')
export class ResponsesController {
    constructor(private svc: ResponsesService) { }

    @Post('bulk')
    async bulk(@Body() body: any, @Req() req: any) {
        const userId = req.user?.sub ?? req.user?.userId;
        if (!body?.items?.length) return { ok: false, message: 'No items' };

        const docs = body.items.map((it: any) => {
            const geo = it.geo ?? it.location;
            return {
                formId: it.formId,
                submittedAt: it.submittedAt
                    ? new Date(it.submittedAt)
                    : new Date(it.createdAt ?? Date.now()),
                deviceId: it.deviceId ?? 'unknown',
                userId,
                answers: it.answers,
                ...(geo && {
                    geo: {
                        ...geo,
                        timestamp: geo.timestamp ? new Date(geo.timestamp) : undefined,
                    },
                }),
            };
        });

        const created = await this.svc.createMany(docs);
        return { ok: true, count: created.length };
    }

    // 🔹 NUEVO: listado paginado con filtros (lo que consume Angular)
    @Get()
    async search(@Query() query: SearchResponsesDto, @Req() req: any) {
        // Si quieres que sólo admin vea todo y enumerator sólo lo suyo,
        // aquí puedes revisar req.user.role y forzar userId.
        // Ejemplo simple: todos ven todo (tal como está ahora).
        return this.svc.search(query);
    }

    @Get('me')
    mine(@Req() req: any) {
        const userId = req.user?.sub ?? req.user?.userId;
        return this.svc.findByUser(userId);
    }

    @Get('general')
    async getGeneral(
        @Query('formId') formId: string,
    ): Promise<GeneralReportDto> {
        // podrías poner un formId por defecto
        const result = await this.svc.getGeneralReport(formId);
        console.log('result: ', result)
        return result;
    }

    @Get('question-stats')
    async getQuestionStats(
        @Query('formId') formId: string,
        @Query('questionId') questionId: string,
    ): Promise<QuestionStatsDto> {
        return this.svc.getQuestionStats(formId, questionId);
    }

    @Get('by-form/all')
    async getAllByFormId(
        @Query('formId') formId: string,
    ) {
        return this.svc.getAllByFormId(formId);
    }
}
import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ResponsesService } from './responses.service';

@Controller('public/forms')
export class PublicResponsesController {
    constructor(private readonly responsesService: ResponsesService) { }

    @Get(':formId/responses')
    async getAllByFormId(@Param('formId') formId: string) {
        return this.responsesService.getAllByFormId(formId);
    }

    @Get(':formId/dashboard')
    async getDashboard(@Param('formId') formId: string) {
        return this.responsesService.getDashboardByFormId(formId);
    }

    @Post(':formId/respond')
    async respond(
        @Param('formId') formId: string,
        @Body() body: any,
    ) {
        if (!body?.answers || typeof body.answers !== 'object') {
            throw new BadRequestException('answers es requerido');
        }

        const created = await this.responsesService.createPublicResponse({
            formId,
            answers: body.answers,
            geo: body.geo ?? null,
            submittedAt: body.submittedAt,
            deviceId: body.deviceId ?? 'public-web',
            userId: body.userId ?? null,
        });

        return {
            ok: true,
            id: String(created._id),
        };
    }
}
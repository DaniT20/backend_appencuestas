import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ResponsesService } from './responses.service';

@UseGuards(JwtAuthGuard)
@Controller('responses')
export class ResponsesController {
    constructor(private svc: ResponsesService) { }

    /* @Post('bulk')
    bulk(@Req() req: any, @Body() body: any) {
        const userId = req.user?.userId;
        const items = (body?.items ?? []).map((r: any) => ({ ...r, userId }));
        console.log('items: ', items)
        return this.svc.createMany(items);
    } */

    @Post('bulk')
    async bulk(@Body() body: any, @Req() req: any) {
        const userId = req.user?.sub; // si usas JWT
        const docs = body.items.map(it => {
            // si la app manda "location", mapeamos:
            const geo = it.geo ? it.geo : (it as any).location ? (it as any).location : undefined;
            return {
                formId: it.formId,
                submittedAt: new Date(it.submittedAt),
                deviceId: it.deviceId,
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
        await this.svc.createMany(docs);
        return { ok: true, count: docs.length };
    }


    @Get('me')
    mine(@Req() req: any) {
        return this.svc.findByUser(req.user.userId);
    }
}

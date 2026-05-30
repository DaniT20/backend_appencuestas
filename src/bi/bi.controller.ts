import { Controller, Get, Query, Req } from '@nestjs/common';
import { BiService } from './bi.service';
import { BiQueryDto } from './dto/bi-query.dto';

@Controller('bi')
export class BiController {
    constructor(private readonly svc: BiService) { }

    @Get('responses')
    responses(@Query() q: BiQueryDto, @Req() req: any) {
        return this.svc.publicResponses(q, req);
    }

    @Get('answers')
    answers(@Query() q: BiQueryDto, @Req() req: any) {
        return this.svc.publicAnswers(q, req);
    }
}

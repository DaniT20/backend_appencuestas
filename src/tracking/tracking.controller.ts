import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TrackingService } from './tracking.service';
import { TrackingQueryDto } from './dto/tracking-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('tracking')
export class TrackingController {
    constructor(private readonly svc: TrackingService) {}

    @Get('dashboard')
    getDashboard(@Query() query: TrackingQueryDto) {
        return this.svc.getDashboard(query);
    }

    @Get('activity')
    getActivity(@Query() query: TrackingQueryDto) {
        return this.svc.getActivityByEnumerator(query);
    }

    @Get('geo')
    getGeo(@Query() query: TrackingQueryDto) {
        return this.svc.getGeoPoints(query);
    }

    @Get('parish-report')
    getParishReport(@Query() query: TrackingQueryDto) {
        return this.svc.getParishReport(query);
    }
}

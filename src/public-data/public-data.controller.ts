import { Controller, Get, Param } from '@nestjs/common';
import { PublicDataService } from './public-data.service';

@Controller('public/forms')
export class PublicDataController {
    constructor(private readonly svc: PublicDataService) {}

    @Get(':formId/data-dictionary')
    getDataDictionary(@Param('formId') formId: string) {
        return this.svc.getDataDictionary(formId);
    }

    @Get(':formId/responses-table')
    getResponsesTable(@Param('formId') formId: string) {
        return this.svc.getResponsesTable(formId);
    }
}

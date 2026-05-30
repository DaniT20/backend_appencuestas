import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { FormsService } from './forms.service';

@Controller('public/forms')
export class PublicFormsController {
    constructor(private readonly formsService: FormsService) { }

    @Get(':formId')
    async getPublicForm(@Param('formId') formId: string) {
        const form = await this.formsService.findPublic(formId);

        if (!form) {
            throw new NotFoundException('Formulario no encontrado o no público');
        }

        return form;
    }
}
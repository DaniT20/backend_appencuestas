import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FormsService } from './forms.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateFormDto, UpdateFormDto } from './dto/create-form.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('forms')
export class FormsController {
    constructor(private forms: FormsService) { }

    @Get()
    list(@Query('updatedSince') updatedSince?: string) {
        return this.forms.findActive(updatedSince);
    }

    @Get('web')
    list_web(@Query('updatedSince') updatedSince?: string) {
        return this.forms.findActive_web(updatedSince);
    }

    @Get(':id')
    get(@Param('id') id: string) {
        return this.forms.findOne(id);
    }

    @Roles('admin')
    @Post()
    create(@Body() dto: CreateFormDto) {
        return this.forms.create(dto);
    }

    @Roles('admin')
    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdateFormDto) {
        console.log('dto: ', dto)
        return this.forms.updateById(id, dto);
    }

    @Roles('admin')
    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.forms.deleteById(id);
    }

    // opcional: upsert
    @Roles('admin')
    @Post('upsert')
    upsert(@Body() dto: CreateFormDto) {
        return this.forms.upsert(dto);
    }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ParishesService } from './parishes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('parishes')
export class ParishesController {
    constructor(private readonly svc: ParishesService) {}

    @Get()
    findAll() {
        return this.svc.findAll();
    }

    @Get('full')
    findAllDocs() {
        return this.svc.findAllDocs();
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body('name') name: string) {
        return this.svc.create(name);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    rename(@Param('id') id: string, @Body('name') name: string) {
        return this.svc.rename(id, name);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/order')
    updateOrder(@Param('id') id: string, @Body('order') order: number) {
        return this.svc.updateOrder(id, order);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.svc.remove(id);
    }
}

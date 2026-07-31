import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { BulkCreateUsersDto } from './dto/bulk-create-users.dto';
import { BulkParroquiasEncuestaDto } from './dto/bulk-parroquias-encuesta.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    create(@Body() dto: CreateUserDto) {
        return this.usersService.create(dto);
    }

    @Post('bulk')
    bulkCreate(@Body() dto: BulkCreateUsersDto) {
        return this.usersService.bulkCreate(dto.users);
    }

    @Get('activity-report')
    activityReport() {
        return this.usersService.getActivityReport();
    }

    @Get()
    findAll(@Query() query: QueryUsersDto) {
        return this.usersService.findAll(query);
    }

    @Get('by-username/:username')
    findByUsername(@Param('username') username: string) {
        return this.usersService.findByUsername(username);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Patch('bulk-parroquias-encuesta')
    bulkUpdateParroquiasEncuesta(@Body() dto: BulkParroquiasEncuestaDto) {
        return this.usersService.bulkUpdateParroquiasEncuesta(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        return this.usersService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
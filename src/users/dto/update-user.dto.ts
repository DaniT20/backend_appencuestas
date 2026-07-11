import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    username?: string;

    @IsString()
    @IsOptional()
    @MinLength(6)
    password?: string;

    @IsString()
    @IsOptional()
    @IsIn(['admin', 'enumerator', 'gestor'])
    role?: 'admin' | 'enumerator' | 'gestor';

    @IsString()
    @IsOptional()
    parroquia?: string;

    @IsBoolean()
    @IsOptional()
    lider?: boolean;

    @IsBoolean()
    @IsOptional()
    active?: boolean;
}

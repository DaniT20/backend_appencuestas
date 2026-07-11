import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsIn,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BulkCreateUserItemDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsString()
    @IsIn(['admin', 'enumerator', 'gestor'])
    role: 'admin' | 'enumerator' | 'gestor';

    @IsString()
    @IsOptional()
    parroquia?: string;

    @IsBoolean()
    @IsOptional()
    active?: boolean;
}

export class BulkCreateUsersDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => BulkCreateUserItemDto)
    users: BulkCreateUserItemDto[];
}
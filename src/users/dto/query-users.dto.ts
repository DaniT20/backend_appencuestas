import { Transform } from 'class-transformer';
import { IsBooleanString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryUsersDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    role?: string;

    @IsOptional()
    @IsString()
    parroquia?: string;

    @IsOptional()
    @IsBooleanString()
    active?: string;

    @Transform(({ value }) => parseInt(value, 10))
    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number = 1;

    @Transform(({ value }) => parseInt(value, 10))
    @IsOptional()
    @IsInt()
    @Min(1)
    limit?: number = 10;
}
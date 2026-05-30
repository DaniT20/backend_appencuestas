import { Transform } from 'class-transformer';
import { IsBooleanString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryUsersDto {
    @IsOptional()
    @IsString()
    search?: string; // busca en username y name

    @IsOptional()
    @IsBooleanString()
    active?: string; // 'true' | 'false'

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
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchResponsesDto {
    @IsOptional()
    @IsString()
    formId?: string;

    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsString()
    dateFrom?: string; // YYYY-MM-DD

    @IsOptional()
    @IsString()
    dateTo?: string;   // YYYY-MM-DD

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number = 1;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    pageSize?: number = 10;
}

import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BiQueryDto {
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
    @Min(0)
    @IsOptional()
    skip?: number = 0;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    limit?: number = 5000;
}

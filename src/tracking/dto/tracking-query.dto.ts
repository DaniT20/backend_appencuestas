import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TrackingQueryDto {
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
    inactiveDays?: number = 3;
}

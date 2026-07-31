import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class BulkParroquiasEncuestaDto {
    @IsArray()
    @IsString({ each: true })
    userIds: string[];

    @IsArray()
    @IsString({ each: true })
    parroquiasEncuesta: string[];

    @IsOptional()
    @IsIn(['replace', 'add'])
    mode?: 'replace' | 'add';
}

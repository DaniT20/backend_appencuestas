import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class OptionDto {
    @IsString() @IsNotEmpty() id: string;
    @IsString() @IsNotEmpty() label: string;
}

class QuestionDto {
    @IsString() @IsNotEmpty() id: string;
    @IsString() @IsIn(['open', 'single', 'multiple']) type: 'open' | 'single' | 'multiple';
    @IsString() @IsNotEmpty() text: string;
    @IsBoolean() @IsOptional() required?: boolean;
    @IsString() @IsOptional() placeholder?: string;
    @IsInt() @Min(1) @IsOptional() maxLength?: number;
    @IsInt() @Min(0) @IsOptional() minSelections?: number;
    @IsInt() @Min(1) @IsOptional() maxSelections?: number;

    @IsArray() @ValidateNested({ each: true }) @Type(() => OptionDto)
    @IsOptional() options?: OptionDto[];
}

export class CreateFormDto {
    @IsString() @IsNotEmpty() formId: string;
    @IsString() @IsNotEmpty() title: string;
    @IsInt() @Min(1) version: number;
    @IsBoolean() @IsOptional() active?: boolean;

    @IsArray() @ValidateNested({ each: true }) @Type(() => QuestionDto)
    questions: QuestionDto[];
}

export class UpdateFormDto {
    @IsString() @IsOptional() title?: string;
    @IsInt() @Min(1) @IsOptional() version?: number;
    @IsBoolean() @IsOptional() active?: boolean;
    @IsArray() @ValidateNested({ each: true }) @Type(() => QuestionDto)
    @IsOptional() questions?: QuestionDto[];
}

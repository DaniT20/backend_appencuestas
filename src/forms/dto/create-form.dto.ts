import {
    IsArray,
    IsBoolean,
    IsIn,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Min,
    ValidateNested,
    IsUrl,
    Max,
    ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

class OptionDto {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsNotEmpty()
    label: string;

    @IsOptional()
    @IsUrl()
    imageUrl?: string;

    @IsOptional()
    @IsString()
    imageKey?: string;

    @IsOptional()
    @IsString()
    parentOptionId?: string;

    @IsOptional()
    @IsBoolean()
    isOther?: boolean;

    @IsOptional()
    @IsString()
    otherPlaceholder?: string;

    @IsOptional()
    @IsBoolean()
    otherRequired?: boolean;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(2000)
    otherMaxLength?: number;

    @IsOptional()
    @IsBoolean()
    hasFollowupText?: boolean;

    @IsOptional()
    @IsString()
    followupPlaceholder?: string;

    @IsOptional()
    @IsBoolean()
    followupRequired?: boolean;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(2000)
    followupMaxLength?: number;
}

class MatrixRowDto {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsNotEmpty()
    label: string;

    @IsOptional()
    @IsBoolean()
    isOther?: boolean;

    @IsOptional()
    @IsString()
    otherPlaceholder?: string;

    @IsOptional()
    @IsBoolean()
    otherRequired?: boolean;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(2000)
    otherMaxLength?: number;
}

class MatrixColumnDto {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsNotEmpty()
    label: string;
}

class ListItemDto {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsNotEmpty()
    label: string;
}

class QuestionDto {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsIn(['open', 'single', 'multiple', 'matrix', 'list'])
    type: 'open' | 'single' | 'multiple' | 'matrix' | 'list';

    @IsString()
    @IsNotEmpty()
    text: string;

    @IsBoolean()
    @IsOptional()
    required?: boolean;

    @IsString()
    @IsOptional()
    placeholder?: string;

    @IsInt()
    @Min(1)
    @IsOptional()
    maxLength?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    minSelections?: number;

    @IsInt()
    @Min(1)
    @IsOptional()
    maxSelections?: number;

    @IsOptional()
    @IsString()
    dependsOnQuestionId?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OptionDto)
    @IsOptional()
    options?: OptionDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MatrixRowDto)
    @IsOptional()
    @ArrayMinSize(1)
    matrixRows?: MatrixRowDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MatrixColumnDto)
    @IsOptional()
    @ArrayMinSize(2)
    matrixColumns?: MatrixColumnDto[];

    @IsInt()
    @Min(1)
    @IsOptional()
    maxRowsToAnswer?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ListItemDto)
    @IsOptional()
    @ArrayMinSize(1)
    listItems?: ListItemDto[];

    @IsBoolean()
    @IsOptional()
    hasValueSelection?: boolean;
}

export class CreateFormDto {
    @IsString()
    @IsNotEmpty()
    formId: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsInt()
    @Min(1)
    version: number;

    @IsBoolean()
    @IsOptional()
    active?: boolean;

    @IsBoolean()
    @IsOptional()
    show?: boolean;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    assignedTo?: string[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuestionDto)
    questions: QuestionDto[];
}

export class UpdateFormDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsInt()
    @Min(1)
    @IsOptional()
    version?: number;

    @IsBoolean()
    @IsOptional()
    active?: boolean;

    @IsBoolean()
    @IsOptional()
    show?: boolean;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    assignedTo?: string[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuestionDto)
    @IsOptional()
    questions?: QuestionDto[];
}
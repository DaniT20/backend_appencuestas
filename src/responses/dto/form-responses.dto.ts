export interface FlattenedMatrixItemDto {
    rowId: string;
    rowLabel?: string;
    columnId: string;
    columnLabel?: string;
    otherText?: string;
}

export interface FlattenedAnswerDto {
    questionId: string;
    questionText?: string;
    type: 'open' | 'single' | 'multiple' | 'matrix';
    value: string | string[] | FlattenedMatrixItemDto[] | null;
    raw: any;
}

export interface FormResponseItemDto {
    id: string;
    formId: string;
    submittedAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
    deviceId: string;
    userId?: string;
    geo?: {
        lat: number;
        lng: number;
        accuracy?: number;
        altitude?: number;
        speed?: number;
        heading?: number;
        timestamp?: Date;
    };
    answers: any[];
    flatAnswers: Record<string, any>;
    normalizedAnswers: FlattenedAnswerDto[];
}

export interface FormResponsesDto {
    formId: string;
    total: number;
    items: FormResponseItemDto[];
}
// src/responses/dto/question-stats.dto.ts
export interface QuestionStatItem {
    label: string;
    count: number;
}

export interface QuestionStatsDto {
    formId: string;
    questionId: string;
    questionText: string;
    totalAnswers: number;
    items: QuestionStatItem[];
}

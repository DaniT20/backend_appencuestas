// dto/general-report.dto.ts

export interface KpiDto {
    label: string;
    value: number;
    hint?: string;
}

export interface CountItemDto {
    label: string;
    count: number;
}

export interface VictimizationSummaryDto {
    victimsCount: number;       // número de víctimas
    victimsRate: number;        // víctimas / total encuestas (%)
    reportedCount: number;      // número que denunció
    reportedRate: number;       // denunciantes / víctimas (%)
    mainCrimes: CountItemDto[]; // top delitos (q32)
    noReportReasons: CountItemDto[]; // razones para no denunciar (q34)
}

export interface GeneralReportDto {
    kpis: KpiDto[];
    byParish: { parish: string; count: number }[];
    byDate: { date: string; count: number }[];
    securityLevels: CountItemDto[];
    victimization?: VictimizationSummaryDto;   // 👈 NUEVO BLOQUE
}

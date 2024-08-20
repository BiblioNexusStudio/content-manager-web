export interface ResourcesByParentResource extends TotalsByMonth {
    parentResourceName: string;
}

export interface ResourcesByLanguage extends ResourcesByParentResource {
    language: string;
}

export interface TotalsByMonth {
    date: Date;
    monthAbbreviation: string;
    resourceCount: number;
}

export interface ResourcesSummary {
    resourcesByParentResource: ResourcesByParentResource[];
    resourcesByLanguage: ResourcesByLanguage[];
    totalsByMonth: TotalsByMonth[];
    allResourcesCount: number;
    multiLanguageResourcesCount: number;
    languages: string[];
    parentResourceNames: string[];
}

export interface ResourceItemsSummary {
    aquiferizedResources: number;
    aquiferizedResourcesThisMonth: number;
    totalNonEnglishResources: number;
    totalNonEnglishResourcesThisMonth: number;
    totalResourceBeingTranslated: number;
    totalResourceBeingTranslatedThisMonth: number;
    totalResources: number;
    totalResourcesThisMonth: number;
    totalResourcesTwoPlusLanguages: number;
    totalResourcesTwoPlusLanguagesThisMonth: number;
}

export enum DynamicReportType {
    Table = 'Table',
    BarChart = 'BarChart',
    LineChart = 'LineChart',
}

export interface BasicDynamicReport {
    name: string;
    slug: string;
}

export interface DynamicReport {
    name: string;
    description: string;
    type: DynamicReportType;
    acceptsDateRange: boolean;
    acceptsLanguage: boolean;
    acceptsParentResource: boolean;
    startDate: string;
    endDate: string;
    columns: string[];
    results: DynamicReportResult[];
}

export type DynamicReportResult = (string | number | boolean)[];

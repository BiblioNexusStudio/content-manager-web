interface ResourcesByParentResource extends TotalsByMonth {
    parentResourceName: string;
}

interface ResourcesByLanguage extends ResourcesByParentResource {
    language: string;
}

interface TotalsByMonth {
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
    showInDropdown: boolean;
}

export interface DynamicReport {
    name: string;
    description: string;
    type: DynamicReportType;
    acceptsDateRange: boolean;
    acceptsLanguage: boolean;
    acceptsParentResource: boolean;
    acceptsCompany: boolean;
    startDate: string;
    endDate: string;
    columns: string[];
    results: DynamicReportResult[];
}

export type DynamicReportResult = (string | number | boolean | null)[];

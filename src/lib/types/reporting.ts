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

export interface StatusCountPerMonth {
    date: Date;
    statusCount: number;
}

export interface MonthlyStartsAndCompletions {
    starts: StatusCountPerMonth[];
    completions: StatusCountPerMonth[];
}

export interface DailyResourceDownloads {
    amount: number;
    date: Date;
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

export interface GenericReportRow {
    [key: string]: string | number;
}

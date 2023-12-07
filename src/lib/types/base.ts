export interface ResourceType {
    id: number;
    displayName: string;
    complexityLevel: string;
}

export interface ResourceContentStatus {
    status: ResourceContentStatusEnum;
    displayName: string;
}

export enum ResourceContentStatusEnum {
    None = 'None',
    AquiferizeNotStarted = 'AquiferizeNotStarted',
    AquiferizeInProgress = 'AquiferizeInProgress',
    Complete = 'Complete',
    AquiferizeInReview = 'AquiferizeInReview',
    TranslateNotStarted = 'TranslateNotStarted',
    TranslateDrafting = 'TranslateDrafting',
    TranslateEditing = 'TranslateEditing',
    TranslateReviewing = 'TranslateReviewing',
    OnHold = 'OnHold',
}

export interface Language {
    id: number;
    iso6393Code: string;
    englishDisplay: string;
}

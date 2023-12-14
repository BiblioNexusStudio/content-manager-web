export type ExtendType<T, K extends keyof T, V> = Omit<T, K> & { [P in K]?: V };

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
    New = 'New',
    AquiferizeInProgress = 'AquiferizeInProgress',
    Complete = 'Complete',
    AquiferizePendingReview = 'AquiferizePendingReview',
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

export interface User {
    id: number;
    name: string;
}

export enum Permission {
    AquiferizeContent = 'aquiferize:content',
    PublishContent = 'publish:content',
    AssignContent = 'assign:content',
    AssignOverride = 'assign:override',
    ReadValues = 'read:values',
    WriteValues = 'write:values',
}

export interface CurrentUserApi extends User {
    permissions: Permission[];
}

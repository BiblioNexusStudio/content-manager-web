import type { ValuesOf } from '@tiptap/core';

export interface ResourceType {
    id: number;
    displayName: string;
    complexityLevel: string;
}

export interface ResourceContentStatus {
    status: ResourceContentStatusEnum;
    displayName: string;
}

export const ResourceContentStatusValues = {
    None: 'None',
    AquiferizeNotStarted: 'AquiferizeNotStarted',
    AquiferizeInProgress: 'AquiferizeInProgress',
    Complete: 'Complete',
    AquiferizeInReview: 'AquiferizeInReview',
    TranslateNotStarted: 'TranslateNotStarted',
    TranslateDrafting: 'TranslateDrafting',
    TranslateEditing: 'TranslateEditing',
    TranslateReviewing: 'TranslateReviewing',
    OnHold: 'OnHold',
} as const;

export type ResourceContentStatusEnum = ValuesOf<typeof ResourceContentStatusValues>;

export interface Language {
    id: number;
    iso6393Code: string;
    englishDisplay: string;
}

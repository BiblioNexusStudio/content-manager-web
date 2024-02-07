import type { Permission } from '$lib/stores/auth';

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
    AquiferizeReviewPending = 'AquiferizeReviewPending',
    AquiferizeInReview = 'AquiferizeInReview',
    TranslationNotStarted = 'TranslationNotStarted',
    TranslationInProgress = 'TranslationInProgress',
    TranslationReviewPending = 'TranslationReviewPending',
    TranslationInReview = 'TranslationInReview',
    OnHold = 'OnHold',
}

export interface Language {
    id: number;
    iso6393Code: string;
    englishDisplay: string;
}

export interface BasicUser {
    id: number;
    name: string;
}

export enum UserRole {
    None = 'None',
    Editor = 'Editor',
    Manager = 'Manager',
    Publisher = 'Publisher',
    Admin = 'Admin',
}

export interface User extends BasicUser {
    role: UserRole;
    companyName: string;
}

export interface CurrentUserApi extends User {
    permissions: Permission[];
}

export interface Bible {
    id: number;
    name: string;
    abbreviation: string;
    books: [
        {
            bookCode: string;
            displayName: string;
            textSize: number;
            audioSize: number;
            chapterCount: number;
        },
    ];
}

export interface ProjectPlatform {
    id: number;
    name: string;
}

export interface Company {
    id: number;
    name: string;
}

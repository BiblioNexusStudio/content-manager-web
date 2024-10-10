import type { Language, ResourceContentStatusEnum } from './base';
import type { CommentThreadsResponse } from '$lib/types/comments';

export enum MediaTypeEnum {
    audio = 'Audio',
    video = 'Video',
    image = 'Image',
    text = 'Text',
}

export enum OpenedSupplementalSideBar {
    None,
    Comments,
    BibleReferences,
}

export interface PassageReference {
    startVerseId: number;
    startBook: string;
    startChapter: number;
    startVerse: number;
    endVerseId: number;
    endBook: string;
    endChapter: number;
    endVerse: number;
}

export interface VerseReference {
    verseId: number;
    book: string;
    chapter: number;
    verse: number;
}

export interface TiptapContentItem {
    stepNumber?: number;
    tiptap: object;
}

export interface VideoContentItem {
    url: string;
    thumbnailUrl: string;
    duration: number;
    displayName: string;
}

export interface ImageContentItem {
    url: string;
    displayName: string;
}

export type Content = ImageContentItem | VideoContentItem | TiptapContentItem[];

export interface AssociatedResource {
    contentId: number | null;
    mediaTypes: MediaTypeEnum[];
    parentResourceName: string;
    englishLabel: string;
}

interface ResourceContentAssignedUser {
    id: number;
    name: string;
    companyId: number;
}

export interface ContentTranslation {
    contentId: number;
    languageId: number;
    status: string;
    hasDraft: boolean;
    hasPublished: boolean;
    resourceContentStatus: ResourceContentStatusEnum;
}

export interface ResourceContent {
    englishLabel: string;
    passageReferences: PassageReference[];
    verseReferences: VerseReference[];
    associatedResources: AssociatedResource[];
    parentResourceName: string;
    parentResourceLicenseInfo: ParentResourceLicenseInfo | null;
    resourceContentId: number;
    mediaType: MediaTypeEnum;
    status: ResourceContentStatusEnum;
    language: Language;
    contentTranslations: ContentTranslation[];
    project: Project | null;
    hasPublishedVersion: boolean;
    displayName: string;
    contentSize: number;
    assignedUser: ResourceContentAssignedUser | null;
    content: Content;
    isPublished: boolean;
    isDraft: boolean;
    canPullBackToManagerReview: boolean;
    resourceContentVersionId: boolean;
    wordCount: number | null;
    snapshots: BasicSnapshot[];
    versions: BasicVersion[];
    commentThreads: CommentThreadsResponse;
    machineTranslations: MachineTranslation[];
    reviewLevel: ResourceContentVersionReviewLevel;
}

export interface ResourceContentNextUpInfo {
    nextUpResourceContentId: number | null;
}

interface ParentResourceLicenseInfo {
    title: string;
    copyright: {
        dates?: string | null;
        holder: { name: string; url?: string | null };
    };
    licenses: Record<string, SingleLicenseInfo>[];
    showAdaptationNoticeForEnglish: boolean;
    showAdaptationNoticeForNonEnglish: boolean;
}

interface SingleLicenseInfo {
    name: string;
    url?: string | null;
}

export interface BasicSnapshot {
    id: number;
    created: string;
    assignedUserName: string | null;
    status: string;
}

export interface BasicVersion {
    id: number;
    created: string;
    version: number;
    isPublished: boolean;
}

export interface Snapshot {
    id: number;
    displayName: string;
    wordCount: number | null;
    content: Content;
    created: string;
    assignedUserName: string | null;
    status: string;
}

export interface Version {
    id: number;
    displayName: string;
    wordCount: number | null;
    content: Content;
    created: string;
    isPublished: boolean;
    version: number;
}

export interface Project {
    id: number;
    name: string;
    isComplete: boolean;
}

export interface MachineTranslation {
    id: number;
    userId: number;
    contentIndex: number;
    userRating?: number;
    improveClarity?: boolean;
    improveTone?: boolean;
    improveConsistency?: boolean;
    created?: string;
    retranslationReason?: string;
    hadRetranslation?: boolean;
}

export interface Assignment {
    assignedUserId: number;
    resourceContentId: number;
}

export enum ResourceContentVersionReviewLevel {
    community = 'Community',
    professional = 'Professional',
}

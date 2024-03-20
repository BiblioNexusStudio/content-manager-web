import type { Language, ResourceContentStatusEnum } from './base';

export enum ResourceTypeEnum {
    cbbterTranslationGuide = 'Translation Guide (SRV)',
    tyndaleBibleDictionary = 'Bible Dictionary (Tyndale)',
    tyndaleStudyNotes = 'Study Notes (Tyndale)',
    ubsImages = 'Images (UBS)',
    videoBibleDictionary = 'Videos (Video Bible Dictionary)',
}

export enum MediaTypeEnum {
    audio = 'Audio',
    video = 'Video',
    image = 'Image',
    text = 'Text',
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

interface TextContent {
    type: string;
    text: string;
}

interface Paragraph {
    type: string;
    content: TextContent[];
}

interface Heading {
    type: string;
    attrs: {
        level: number;
    };
    content: TextContent[];
}

interface BulletList {
    type: string;
    content: ListItem[];
}

interface ListItem {
    type: string;
    content: Paragraph[];
}

export interface Tiptap {
    type: string;
    content: (Heading | Paragraph | BulletList)[];
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

type Content = ImageContentItem | VideoContentItem | TiptapContentItem[];

export interface AssociatedResource {
    contentId: number | null;
    mediaTypes: MediaTypeEnum[];
    parentResourceName: string;
    englishLabel: string;
}

export interface ResourceContentAssignedUser {
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
    wordCount: number | null;
    snapshots: BasicSnapshot[];
}

export interface BasicSnapshot {
    id: number;
    created: string;
    assignedUserName: string | null;
    status: string;
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

export interface Project {
    id: number;
    name: string;
}

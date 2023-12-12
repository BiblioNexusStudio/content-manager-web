import type { ResourceContentStatusEnum } from './base';

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
    label: string;
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

export interface ContentItem {
    stepNumber: number;
    tiptap: string;
    url: string;
    thumbnailUrl: string;
    duration: number;
    displayName: string;
}

export interface Language {
    id: number;
    displayName: string;
}

export interface AssociatedResource {
    mediaTypes: string[];
    parentResourceName: string;
    label: string;
}

export interface ResourceContentAssignedUser {
    id: number;
    name: string;
}

export interface ContentIdWithLanguageId {
    contentId: number;
    languageId: number;
}

export interface ResourceContent {
    passageReferences: PassageReference[];
    associatedResources: AssociatedResource[];
    parentResourceName: string;
    resourceContentId: number;
    displayName: string;
    mediaType: string;
    status: ResourceContentStatusEnum;
    contentSize: number;
    language: Language;
    content: ContentItem | ContentItem[];
    hasAudio: boolean;
    isPublished: boolean;
    assignedUser: ResourceContentAssignedUser | null;
    otherLanguageContentIds: ContentIdWithLanguageId[];
}

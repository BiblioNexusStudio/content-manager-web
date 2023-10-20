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
    tiptap: Tiptap;
    url: string;
    thumbnailUrl: string;
    duration: number;
    displayName: string;
}

export interface Language {
    id: number;
    displayName: string;
}

export interface ResourceItem {
    displayName: string;
    mediaType: string;
    status: string;
    contentSize: number;
    language: Language;
    content: ContentItem | ContentItem[];
}

export interface AssociatedResource {
    mediaTypes: string[];
    type: string;
    label: string;
}

export interface Resource {
    passageReferences: PassageReference[];
    resources: ResourceItem[];
    associatedResources: AssociatedResource[];
    type: string;
    label: string;
}

export interface ResourceResponse {
    resource: Resource;
}

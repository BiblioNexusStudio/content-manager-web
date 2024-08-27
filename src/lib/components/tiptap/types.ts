export interface VerseReference {
    startVerse: string | number;
    endVerse: string | number;
}

export interface ResourceReference {
    resourceId: string | number;
    resourceType: string;
}

export interface ContentNode {
    type: string;
    marks?: MarkType[];
    content?: ContentNode[];
}

export interface MarkType {
    type: string;
    attrs?: {
        verses?: VerseReference[];
        resourceId?: string | number;
        resourceType?: string;
    };
}

export interface HelpDocument {
    id: number;
    title: string;
    type: HelpDocumentType;
    url: string;
    created_at: string;
    updated_at: string;
}

export enum HelpDocumentType {
    None = 'None',
    Release = 'Release',
    HowTo = 'HowTo',
}

export interface HelpDocumentResponse {
    releases: HelpDocument[];
    howTos: HelpDocument[];
    releasesCount: number;
    howtosCount: number;
}

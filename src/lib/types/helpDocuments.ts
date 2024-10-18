export interface HelpDocument {
    id: number;
    title: string;
    type: HelpDocumentType;
    url: string;
    enabled: boolean;
    thumbnailUrl: string | null;
}

export enum HelpDocumentType {
    None = 'None',
    Release = 'Release',
    HowTo = 'HowTo',
}

export interface HelpDocumentResponse {
    releases: HelpDocument[];
    howTos: HelpDocument[];
}

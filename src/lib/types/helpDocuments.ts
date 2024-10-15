export interface HelpDocument {
    id: number;
    title: string;
    type: HelpDocumentType;
    url: string;
    enabled: boolean;
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

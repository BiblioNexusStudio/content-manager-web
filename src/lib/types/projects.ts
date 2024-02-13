export interface ProjectListResponse {
    id: number;
    name: string;
    language: string;
    projectLead: string;
    company: string;
    projectPlatform: string;
    days?: number;
    counts: ProjectResourceStatusCounts;
}

export interface ProjectResourceStatusCounts {
    inProgress: number;
    inReview: number;
    completed: number;
}

export interface ProjectTableColumn {
    name: string;
    label: string;
    sorted: boolean;
}

export interface ProjectResponse {
    name: string;
    language: string;
    projectManager: string;
    company: string;
    projectPlatform: string;
    companyLead?: string;
    sourceWordCount: number;
    effectiveWordCount?: number;
    quotedCost?: number;
    started?: string | null;
    projectedDeliveryDate?: string;
    actualDeliveryDate?: string;
    projectedPublishDate?: string;
    actualPublishDate?: string;
    counts: ProjectResourceStatusCounts;
}

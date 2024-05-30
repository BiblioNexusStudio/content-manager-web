export interface ProjectListResponse {
    id: number;
    name: string;
    language: string;
    projectLead: string;
    company: string;
    projectPlatform: string;
    resource: string;
    itemCount: number;
    wordCount: number;
    manager?: string;
    days?: number;
    counts: ProjectResourceStatusCounts;
    isStarted: boolean;
}

export interface ProjectResourceStatusCounts {
    notStarted: number;
    inProgress: number;
    inManagerReview: number;
    inPublisherReview: number;
    completed: number;
}

export interface ProjectTableColumn {
    name: string;
    label: string;
    sorted: boolean;
    sortable: boolean;
}

export interface ProjectResouce {
    assignedUserName: string | null;
    englishLabel: string | null;
    parentResourceName: string | null;
    resourceContentId: number | null;
    statusDisplayName: string | null;
}

export interface ProjectResponse {
    id: number;
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
    items: ProjectResouce[];
}

export enum ProjectConstants {
    AQUIFER = 'Aquifer',
}

export enum ProjectStatusTab {
    active = 'active',
    recentlyFinished = 'recently-finished',
    notStarted = 'not-started',
    none = 'none',
}

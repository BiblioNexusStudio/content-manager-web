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
    isCompleted: boolean;

    // calculated on frontend
    daysForSorting?: number;
}

export interface ProjectResourceStatusCounts {
    notStarted: number;
    inProgress: number;
    inManagerReview: number;
    inPublisherReview: number;
    completed: number;
}

export interface ProjectResource {
    assignedUserName: string | null;
    englishLabel: string | null;
    parentResourceName: string | null;
    resourceContentId: number | null;
    statusDisplayName: string | null;
    sortOrder: number | null;
    wordCount: number | null;
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
    items: ProjectResource[];
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

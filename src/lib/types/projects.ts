export interface ProjectListResponse {
    id: number;
    name: string;
    language: string;
    projectLead: string;
    company: string;
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

export interface ActiveProjectsPerCompanyResponse {
    company: string;
    activeProjectCount: number;
    lateProjectCount: number;
    itemCount: number;
    largeItemCount: number;
    wordCount: number;
    notStartedItemCount: number;
    editorReviewItemCount: number;
    inCompanyReviewItemCount: number;
    inPublisherReviewItemCount: number;
    completedItemCount: number;
}

export interface CompanyAverageDaysInWorkflowResponse {
    month: string;

    shortResourcesDaysToStart: number | null;
    shortResourcesDaysWithPartner: number | null;
    shortResourcesDaysTotal: number | null;

    longResourcesDaysToStart: number | null;
    longResourcesDaysWithPartner: number | null;
    longResourcesDaysTotal: number | null;

    daysToStart: number | null;
    daysWithPartner: number | null;
    daysTotal: number | null;
}

export interface CompanyCompletedItemsPerMonthResponse {
    month: string;
    longResourceCount: number;
    shortResourceCount: number;
}

export interface ProjectResourceStatusCounts {
    notStarted: number;
    editorReview: number;
    inCompanyReview: number;
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

export enum ProjectStatusTab {
    active = 'active',
    recentlyFinished = 'recently-finished',
    notStarted = 'not-started',
    reporting = 'reporting',
}

export interface ProjectListResponse {
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

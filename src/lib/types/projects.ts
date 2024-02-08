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

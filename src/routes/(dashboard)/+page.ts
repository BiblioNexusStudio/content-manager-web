import type { PageLoad } from './$types';
import { getFromApiWithoutBlocking } from '$lib/utils/http-service';
import { Permission, userCan } from '$lib/stores/auth';
import { get } from 'svelte/store';
import type { ResourceContentStatusEnum } from '$lib/types/base';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ parent, fetch }) => {
    await parent();

    if (get(userCan)(Permission.ReviewContent) || get(userCan)(Permission.PublishContent)) {
        const reportingSummary = getFromApiWithoutBlocking<ResourcesSummary>('/admin/resources/summary', fetch);
        const assignedProjects = getFromApiWithoutBlocking<Project[]>('/projects/assigned-to-self', fetch);
        const assignedResourceContent = fetchAssignedResourceContent(fetch);
        const reviewPendingResourceContent = getFromApiWithoutBlocking<ResourcePendingReview[]>(
            '/resources/content/review-pending',
            fetch
        );
        return {
            publisherDashboard: {
                assignedResourceContent,
                reportingSummary,
                reviewPendingResourceContent,
                assignedProjects,
            },
        };
    } else if (get(userCan)(Permission.ReadCompanyContentAssignments)) {
        const assignedResourceContent = fetchAssignedResourceContent(fetch);
        const toAssignContent = getFromApiWithoutBlocking<ResourceAssignedToSelf[]>(
            '/resources/content/to-assign',
            fetch
        );
        const manageResourceContent = getFromApiWithoutBlocking<ResourceAssignedToOwnCompany[]>(
            '/resources/content/assigned-to-own-company',
            fetch
        );
        return { managerDashboard: { assignedResourceContent, toAssignContent, manageResourceContent } };
    } else if (get(userCan)(Permission.EditContent)) {
        const resourceContent = fetchAssignedResourceContent(fetch);
        return { editorDashboard: { resourceContent } };
    } else if (get(userCan)(Permission.ReadReports)) {
        throw redirect(302, '/reporting');
    } else {
        return {};
    }
};

function fetchAssignedResourceContent(injectedFetch: typeof window.fetch) {
    return getFromApiWithoutBlocking<ResourceAssignedToSelf[]>('/resources/content/assigned-to-self', injectedFetch);
}

export interface ResourcesByParentResource extends TotalsByMonth {
    parentResourceName: string;
}

export interface ResourcesByLanguage extends ResourcesByParentResource {
    language: string;
}

export interface TotalsByMonth {
    date: Date;
    monthAbbreviation: string;
    resourceCount: number;
}

export interface Project {
    id: number;
    name: string;
    language: string;
    company: string;
    projectPlatform: string;
    days?: number;
    counts: ProjectResourceStatusCounts;
    isStarted: boolean;
}

export interface ProjectResourceStatusCounts {
    inProgress: number;
    inReview: number;
    completed: number;
}

export interface ResourcesSummary {
    resourcesByParentResource: ResourcesByParentResource[];
    resourcesByLanguage: ResourcesByLanguage[];
    totalsByMonth: TotalsByMonth[];
    allResourcesCount: number;
    multiLanguageResourcesCount: number;
    languages: string[];
    parentResourceNames: string[];
}

export interface ResourceAssignedToSelf {
    id: number;
    englishLabel: string;
    languageEnglishDisplay: string;
    parentResourceName: string;
    daysSinceAssignment: number;
    wordCount: number | null;
    statusDisplayName: string;
    statusValue: ResourceContentStatusEnum;
    projectName: string | null;
    daysUntilProjectDeadline: number | null;
    rowSelected: boolean;
    daysSinceContentUpdated: number | null;
    sortOrder: number;
}

export interface ResourceAssignedToOwnCompany extends ResourceAssignedToSelf {
    assignedUser: {
        id: number;
        name: string;
    };
}

export interface ResourcePendingReview {
    id: number;
    englishLabel: string;
    parentResourceName: string;
    languageEnglishDisplay: string;
    daysSinceStatusChange: number;
    wordCount: number | null;
    daysSinceContentUpdated: number | null;
    sortOrder: number;
}

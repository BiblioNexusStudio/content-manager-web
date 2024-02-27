import type { PageLoad } from './$types';
import { getFromApiWithoutBlocking } from '$lib/utils/http-service';
import { Permission, userCan } from '$lib/stores/auth';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ fetch, parent }) => {
    await parent();

    if (get(userCan)(Permission.ReviewContent) || get(userCan)(Permission.PublishContent)) {
        const reportingSummary = getFromApiWithoutBlocking<ResourcesSummary>('/admin/resources/summary', {}, fetch);
        const assignedResourceContent = fetchAssignedResourceContent(fetch);
        const reviewPendingResourceContent = getFromApiWithoutBlocking<ResourcePendingReview[]>(
            '/resources/content/review-pending',
            {},
            fetch
        );
        return { publisherDashboard: { assignedResourceContent, reportingSummary, reviewPendingResourceContent } };
    } else if (get(userCan)(Permission.ReadCompanyContentAssignments)) {
        const assignedResourceContent = fetchAssignedResourceContent(fetch);
        const manageResourceContent = getFromApiWithoutBlocking<ResourceAssignedToOwnCompany[]>(
            '/resources/content/assigned-to-own-company',
            {},
            fetch
        );
        return { managerDashboard: { assignedResourceContent, manageResourceContent } };
    } else if (get(userCan)(Permission.EditContent)) {
        const resourceContent = fetchAssignedResourceContent(fetch);
        return { editorDashboard: { resourceContent } };
    } else {
        return {};
    }
};

function fetchAssignedResourceContent(injectedFetch: typeof window.fetch) {
    return getFromApiWithoutBlocking<ResourceAssignedToSelf[]>(
        '/resources/content/assigned-to-self',
        {},
        injectedFetch
    );
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
    status: string;
    projectName: string | null;
    daysUntilProjectDeadline: number | null;
}

export interface ResourceAssignedToOwnCompany extends ResourceAssignedToSelf {
    id: number;
    englishLabel: string;
    languageEnglishDisplay: string;
    parentResourceName: string;
    wordCount: number | null;
    projectName: string | null;
    daysUntilProjectDeadline: number | null;
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
}

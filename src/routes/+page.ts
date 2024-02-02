import type { PageLoad } from './$types';
import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import { Role } from '$lib/stores/auth';

export const load: PageLoad = async ({ fetch, parent }) => {
    const data = await parent();

    if (!data.currentUser) {
        return {};
    }

    if (data.currentUser.is(Role.Publisher) || data.currentUser.is(Role.Admin)) {
        const reportingSummary = fetchJsonStreamingFromApi(
            '/admin/resources/summary',
            {},
            fetch
        ) as StreamedData<ResourcesSummary>;
        const assignedResourceContent = fetchAssignedResourceContent(fetch);
        const pendingReviewResourceContent = fetchJsonStreamingFromApi(
            '/admin/resources/content/pending-review',
            {},
            fetch
        ) as StreamedData<ResourcePendingReview[]>;
        return { publisherDashboard: { assignedResourceContent, reportingSummary, pendingReviewResourceContent } };
    } else if (data.currentUser.is(Role.Editor)) {
        const resourceContent = fetchAssignedResourceContent(fetch);
        return { editorDashboard: { resourceContent } };
    } else {
        return {};
    }
};

function fetchAssignedResourceContent(injectedFetch: typeof window.fetch) {
    return fetchJsonStreamingFromApi('/admin/resources/content/assigned-to-self', {}, injectedFetch) as StreamedData<
        ResourceAssignedToSelf[]
    >;
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
    contentId: number;
    displayName: string;
    parentResourceName: string;
    daysSinceAssignment: number;
    wordCount: number | null;
}

export interface ResourcePendingReview {
    contentId: number;
    displayName: string;
    parentResourceName: string;
    daysSinceStatusChange: number;
    wordCount: number | null;
    assignedUserName: string | null;
}

import type { PageLoad } from './$types';
import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import { Role } from '$lib/stores/auth';

export const load: PageLoad = async ({ fetch, parent }) => {
    const data = await parent();

    if (data.currentUser.is(Role.Editor)) {
        const resourceContent = fetchJsonStreamingFromApi(
            '/admin/resources/content/assigned-to-self',
            {},
            fetch
        ) as StreamedData<ResourceAssignedToSelf[]>;
        return { editorDashboard: { resourceContent } };
    } else {
        const summary = fetchJsonStreamingFromApi(
            '/admin/resources/summary',
            {},
            fetch
        ) as StreamedData<ResourcesSummary>;
        return { summary };
    }
};

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
    wordCount: number;
}

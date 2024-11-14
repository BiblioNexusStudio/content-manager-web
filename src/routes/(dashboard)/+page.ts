import type { PageLoad } from './$types';
import { getFromApi } from '$lib/utils/http-service';
import { Permission, userCan } from '$lib/stores/auth';
import { get } from 'svelte/store';
import type { BibleBook, ResourceContentStatusEnum } from '$lib/types/base';
import { redirect } from '@sveltejs/kit';
import type { ProjectResourceStatusCounts } from '$lib/types/projects';
import type { ResourceContentVersionReviewLevel } from '$lib/types/resources';

export const load: PageLoad = async ({ parent, fetch }) => {
    await parent();

    if (get(userCan)(Permission.ReviewContent) || get(userCan)(Permission.PublishContent)) {
        const [assignedProjects, assignedResourceContent, reviewPendingResourceContent, notApplicableContent] =
            await Promise.all([
                getFromApi<Project[]>('/projects/assigned-to-self', fetch),
                fetchAssignedResourceContent(fetch),
                getFromApi<ResourcePendingReview[]>('/resources/content/review-pending', fetch),
                getFromApi<NotApplicableContent[]>('/resources/content/not-applicable', fetch),
            ]);

        return {
            publisherDashboard: {
                assignedResourceContent,
                reviewPendingResourceContent,
                assignedProjects,
                notApplicableContent,
            },
        };
    } else if (get(userCan)(Permission.ReadCompanyContentAssignments)) {
        const [assignedResourceContent, toAssignContent, manageResourceContent, assignedUsersWordCount] =
            await Promise.all([
                fetchAssignedResourceContent(fetch),
                getFromApi<ResourceAssignedToSelf[]>('/resources/content/to-assign', fetch),
                getFromApi<ResourceAssignedToOwnCompany[]>('/resources/content/assigned-to-own-company', fetch),
                getFromApi<UserWordCount[]>('/users/assigned-word-count', fetch),
            ]);

        return {
            managerDashboard: {
                assignedResourceContent,
                toAssignContent,
                manageResourceContent,
                assignedUsersWordCount,
            },
        };
    } else if (get(userCan)(Permission.CreateCommunityContent)) {
        const [assignedResourceContent, assignedResourceHistoryContent, bibleBooks] = await Promise.all([
            fetchAssignedResourceContent(fetch),
            getFromApi<ResourceAssignedToSelfHistory[]>('/resources/content/assigned-to-self/history', fetch),
            getFromApi<BibleBook[]>('/bibles/1/books', fetch),
        ]);

        return { communityReviewerDashboard: { assignedResourceContent, assignedResourceHistoryContent, bibleBooks } };
    } else if (get(userCan)(Permission.EditContent)) {
        const [assignedResourceContent, assignedResourceHistoryContent] = await Promise.all([
            fetchAssignedResourceContent(fetch),
            getFromApi<ResourceAssignedToSelfHistory[]>('/resources/content/assigned-to-self/history', fetch),
        ]);

        return { editorDashboard: { assignedResourceContent, assignedResourceHistoryContent } };
    } else if (get(userCan)(Permission.ReadReports)) {
        throw redirect(302, '/reporting');
    } else {
        return {};
    }
};

function fetchAssignedResourceContent(injectedFetch: typeof window.fetch) {
    return getFromApi<ResourceAssignedToSelf[]>('/resources/content/assigned-to-self', injectedFetch);
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
    lastAssignedUser: ResourceUser | null;
}

export interface ResourceThatNeedsTranslationResponse {
    total: number;
    resourceContents: ResourceThatNeedsTranslation[];
}

export interface ResourceThatNeedsTranslation {
    id: number;
    englishLabel: string;
    parentResourceName: string;
    wordCount: number | null;
}

export interface ResourceAssignedToSelfHistory {
    id: number;
    englishLabel: string;
    parentResourceName: string;
    lastActionTime: string;
    sourceWords: number | null;
    sortOrder: number;
}

export interface ResourceAssignedToOwnCompany extends ResourceAssignedToSelf {
    assignedUser: ResourceUser;
}

export interface ResourceUser {
    id: number;
    name: string;
}

export interface ResourcePendingReview {
    id: number;
    englishLabel: string;
    parentResourceName: string;
    languageEnglishDisplay: string;
    projectName: string | null;
    daysSinceStatusChange: number;
    wordCount: number | null;
    daysSinceContentUpdated: number | null;
    reviewLevel: ResourceContentVersionReviewLevel;
    sortOrder: number;
}

export interface UserWordCount {
    userId: number;
    userName: string;
    assignedSourceWordCount: number;
}

export interface NotApplicableContent {
    id: number;
    language: string;
    parentResourceName: string;
    title: string;
    projectName: string | null;
}

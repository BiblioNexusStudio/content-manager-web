import type { PageLoad } from './$types';
import { getFromApi } from '$lib/utils/http-service';
import { Permission, userCan } from '$lib/stores/auth';
import { get } from 'svelte/store';
import type { BibleBook, ResourceContentStatusEnum } from '$lib/types/base';
import { redirect } from '@sveltejs/kit';
import type { ProjectResourceStatusCounts } from '$lib/types/projects';
import type { ResourceContentVersionReviewLevel } from '$lib/types/resources';
import type { HelpDocumentResponse } from '$lib/types/helpDocuments';
import { flattenNotificationsContent } from './notifications-helpers';

export const load: PageLoad = async ({ parent, fetch }) => {
    await parent();

    if (get(userCan)(Permission.ReviewContent) || get(userCan)(Permission.PublishContent)) {
        const [
            assignedProjects,
            assignedResourceContent,
            reviewPendingResourceContent,
            notApplicableContent,
            notificationsContent,
        ] = await Promise.all([
            getFromApi<Project[]>('/projects/assigned-to-self', fetch),
            fetchAssignedResourceContent(fetch),
            getFromApi<ResourcePendingReview[]>('/resources/content/review-pending', fetch),
            getFromApi<NotApplicableContent[]>('/resources/content/not-applicable', fetch),
            getFromApi<NotificationsContent[]>('/notifications', fetch),
        ]);

        const flattenedNotificationsContent = flattenNotificationsContent(notificationsContent);

        return {
            publisherDashboard: {
                assignedResourceContent,
                reviewPendingResourceContent,
                assignedProjects,
                notApplicableContent,
                flattenedNotificationsContent,
            },
        };
    } else if (get(userCan)(Permission.ReadCompanyContentAssignments)) {
        const [
            assignedResourceContent,
            toAssignContent,
            manageResourceContent,
            assignedUsersWordCount,
            notificationsContent,
        ] = await Promise.all([
            fetchAssignedResourceContent(fetch),
            getFromApi<ResourceAssignedToSelf[]>('/resources/content/to-assign', fetch),
            getFromApi<ResourceAssignedToOwnCompany[]>('/resources/content/assigned-to-own-company', fetch),
            getFromApi<UserWordCount[]>('/users/assigned-word-count', fetch),
            getFromApi<NotificationsContent[]>('/notifications', fetch),
        ]);

        const flattenedNotificationsContent = flattenNotificationsContent(notificationsContent);

        return {
            managerDashboard: {
                assignedResourceContent,
                toAssignContent,
                manageResourceContent,
                assignedUsersWordCount,
                flattenedNotificationsContent,
            },
        };
    } else if (get(userCan)(Permission.CreateCommunityContent)) {
        const [assignedResourceContent, assignedResourceHistoryContent, bibleBooks, helpDocs, notificationsContent] =
            await Promise.all([
                fetchAssignedResourceContent(fetch),
                getFromApi<ResourceAssignedToSelfHistory[]>('/resources/content/assigned-to-self/history', fetch),
                getFromApi<BibleBook[]>('/bibles/1/books', fetch),
                getFromApi<HelpDocumentResponse>('/help/aquifer-cms/documents', fetch),
                getFromApi<NotificationsContent[]>('/notifications', fetch),
            ]);

        const flattenedNotificationsContent = flattenNotificationsContent(notificationsContent);

        return {
            communityReviewerDashboard: {
                assignedResourceContent,
                assignedResourceHistoryContent,
                bibleBooks,
                helpDocs,
                flattenedNotificationsContent,
            },
        };
    } else if (get(userCan)(Permission.EditContent)) {
        const [assignedResourceContent, assignedResourceHistoryContent, notificationsContent] = await Promise.all([
            fetchAssignedResourceContent(fetch),
            getFromApi<ResourceAssignedToSelfHistory[]>('/resources/content/assigned-to-self/history', fetch),
            getFromApi<NotificationsContent[]>('/notifications', fetch),
        ]);

        const flattenedNotificationsContent = flattenNotificationsContent(notificationsContent);

        return {
            editorDashboard: { assignedResourceContent, assignedResourceHistoryContent, flattenedNotificationsContent },
        };
    } else if (get(userCan)(Permission.ReadReports)) {
        redirect(302, '/reporting');
    } else {
        return {};
    }
};

function fetchAssignedResourceContent(injectedFetch: typeof window.fetch) {
    return getFromApi<ResourceAssignedToSelf[]>('/resources/content/assigned-to-self', injectedFetch);
}

export enum _CommunityReviewerTab {
    resources = 'resources',
    myHistory = 'my-history',
    help = 'help',
    notifications = 'notifications',
}

export enum _PublisherTab {
    myWork = 'my-work',
    reviewPending = 'review-pending',
    myProjects = 'my-projects',
    community = 'community',
    notApplicable = 'not-applicable',
    notifications = 'notifications',
}

export enum _ManagerTab {
    myWork = 'my-work',
    toAssign = 'to-assign',
    manage = 'manage',
    notifications = 'notifications',
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
    hasAudio: boolean;
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
    hasUnresolvedCommentThreads: boolean;
}

export interface ResourceThatNeedsTranslationResponse {
    total: number;
    resourceContents: ResourceThatNeedsTranslation[];
}

export interface ResourceThatNeedsTranslation {
    id: number;
    englishLabel: string;
    parentResourceName: string;
    hasAudio: boolean;
    wordCount: number | null;
}

export interface ResourceAssignedToSelfHistory {
    id: number;
    englishLabel: string;
    parentResourceName: string;
    hasAudio: boolean;
    lastActionTime: string;
    sourceWords: number | null;
    sortOrder: number;
}

export interface ResourceAssignedToOwnCompany extends ResourceAssignedToSelf {
    assignedUser: ResourceUser;
    assignedReviewerUser: ResourceUser | null;
}

export interface ResourceUser {
    id: number;
    name: string;
}

export interface ResourcePendingReview {
    id: number;
    englishLabel: string;
    parentResourceName: string;
    hasAudio: boolean;
    languageEnglishDisplay: string;
    projectName: string | null;
    daysSinceStatusChange: number;
    wordCount: number | null;
    daysSinceContentUpdated: number | null;
    reviewLevel: ResourceContentVersionReviewLevel;
    sortOrder: number;
    hasUnresolvedCommentThreads: boolean;
}

export interface UserWordCount {
    userId: number;
    userName: string;
    assignedSourceWordCount: number;
}

export interface NotApplicableContent {
    id: number;
    hasAudio: boolean;
    notApplicableReason: string;
    language: string;
    parentResourceName: string;
    title: string;
    projectName: string | null;
}

export interface HelpDocumentNotification {
    id: number;
    title: string;
    created: string;
    type: HelpDocumentType;
    url: string;
    thumbnailUrl?: string;
}

export interface NotificationsContent {
    kind: _NotificationKind;
    helpDocument: HelpDocumentNotification | null;
    isRead: boolean;
    comment: CommentNotification | null;
}

export interface CommentNotification {
    id: number;
    text: string;
    created: string;
    user: { id: number; name: string };
    resourceContentId: number;
    resourceEnglishLabel: string;
    parentResourceDisplayName: string;
}

export interface FlattenedNotificationsContent {
    id?: number;
    name?: string;
    time?: string;
    notification?: string;
    notoficationId?: number;
    isRead?: boolean;
    resourceContentId?: number;
    kind?: _NotificationKind;
    parentResourceDisplayName?: string;
    title?: string;
}

export enum _NotificationKind {
    none = 'None',
    comment = 'Comment',
    helpDocument = 'HelpDocument',
}

enum HelpDocumentType {
    None = 0,
    Release = 1,
    HowTo = 2,
}

export enum _EditorTab {
    myWork = 'my-work',
    myHistory = 'my-history',
    notifications = 'notifications',
}

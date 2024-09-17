import type { column } from '$lib/types/table';
import { SortName } from './dashboard-table-sorters';
import type { ResourceAssignedToSelf, ResourcePendingReview, Project } from './+page';

export const assignedContentsColumns: column<ResourceAssignedToSelf>[] = [
    { text: 'Title', itemKey: 'englishLabel', sortKey: SortName.Title },
    { text: 'Resource', itemKey: 'parentResourceName', sortKey: undefined },
    { text: 'Language', itemKey: 'languageEnglishDisplay', sortKey: SortName.Language },
    { text: 'Project', itemKey: 'projectName', sortKey: undefined },
    { text: 'Status', itemKey: 'statusDisplayName', sortKey: undefined },
    { text: 'Last Edit (Days)', itemKey: 'daysSinceContentUpdated', sortKey: undefined },
    {
        text: 'Days Assigned',
        itemKey: 'daysSinceAssignment',
        sortKey: SortName.Days,
    },
    {
        text: 'Source Words',
        itemKey: 'wordCount',
        sortKey: SortName.WordCount,
    },
];

export const reviewPendingContentsColumns: column<ResourcePendingReview>[] = [
    { text: 'Title', itemKey: 'englishLabel', sortKey: SortName.Title },
    { text: 'Resource', itemKey: 'parentResourceName', sortKey: undefined },
    { text: 'Language', itemKey: 'languageEnglishDisplay', sortKey: SortName.Language },
    { text: 'Project', itemKey: 'projectName', sortKey: undefined },
    { text: 'Last Edit (Days)', itemKey: 'daysSinceContentUpdated', sortKey: undefined },
    {
        text: 'Days Pending',
        itemKey: 'daysSinceStatusChange',
        sortKey: SortName.Days,
    },
    {
        text: 'Source Words',
        itemKey: 'wordCount',
        sortKey: SortName.WordCount,
    },
];

export const projectColumns: column<Project>[] = [
    { text: 'Title', itemKey: 'name', sortKey: undefined },
    { text: 'Company', itemKey: 'company', sortKey: undefined },
    { text: 'Platform', itemKey: 'projectPlatform', sortKey: undefined },
    { text: 'Language', itemKey: 'language', sortKey: undefined },
    { text: 'Days', itemKey: 'days', sortKey: SortName.Days },
    { text: 'Progress', sortKey: undefined },
];

export const communityPendingContentsColumns: column<ResourcePendingReview>[] = [
    { text: 'Title', itemKey: 'englishLabel', sortKey: SortName.Title },
    { text: 'Resource', itemKey: 'parentResourceName', sortKey: undefined },
    { text: 'Language', itemKey: 'languageEnglishDisplay', sortKey: SortName.Language },
    { text: 'Last Edit (Days)', itemKey: 'daysSinceContentUpdated', sortKey: undefined },
    {
        text: 'Days Pending',
        itemKey: 'daysSinceStatusChange',
        sortKey: SortName.Days,
    },
    {
        text: 'Source Words',
        itemKey: 'wordCount',
        sortKey: SortName.WordCount,
    },
];

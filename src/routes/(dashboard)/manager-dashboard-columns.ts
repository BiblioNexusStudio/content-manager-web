import type { column } from '$lib/types/table';
import { SortName } from './dashboard-table-sorters';
import type { ResourceAssignedToSelf, ResourceAssignedToOwnCompany } from './+page';

export const assignedContentsColumns: column<ResourceAssignedToSelf>[] = [
    { text: 'Title', itemKey: 'englishLabel', sortKey: SortName.Title },
    { text: 'Resource', itemKey: 'parentResourceName', sortKey: undefined },
    { text: 'Language', itemKey: 'languageEnglishDisplay', sortKey: undefined },
    { text: 'Project', itemKey: 'projectName', sortKey: undefined },
    { text: 'Status', itemKey: 'statusDisplayName', sortKey: undefined },
    { text: 'Last Edit (Days)', itemKey: 'daysSinceContentUpdated', sortKey: undefined },
    {
        text: 'Deadline (Days)',
        itemKey: 'daysUntilProjectDeadline',
        sortKey: SortName.Days,
    },
    {
        text: 'Word Count',
        itemKey: 'wordCount',
        sortKey: SortName.WordCount,
    },
];

export const toAssignContentsColumns: column<ResourceAssignedToSelf>[] = [
    { text: 'Title', itemKey: 'englishLabel', sortKey: SortName.Title },
    { text: 'Resource', itemKey: 'parentResourceName', sortKey: undefined },
    { text: 'Language', itemKey: 'languageEnglishDisplay', sortKey: undefined },
    { text: 'Project', itemKey: 'projectName', sortKey: undefined },
    {
        text: 'Deadline (Days)',
        itemKey: 'daysUntilProjectDeadline',
        sortKey: SortName.Days,
    },
    {
        text: 'Word Count',
        itemKey: 'wordCount',
        sortKey: SortName.WordCount,
    },
];

export const manageContentsColumns: column<ResourceAssignedToOwnCompany>[] = [
    { text: 'Title', itemKey: 'englishLabel', sortKey: SortName.Title },
    { text: 'Resource', itemKey: 'parentResourceName', sortKey: undefined },
    { text: 'Language', itemKey: 'languageEnglishDisplay', sortKey: undefined },
    { text: 'Project', itemKey: 'projectName', sortKey: undefined },
    { text: 'Status', itemKey: 'statusDisplayName', sortKey: undefined },
    { text: 'Assigned', itemKey: 'assignedUser', sortKey: undefined },
    { text: 'Last Edit (Days)', itemKey: 'daysSinceContentUpdated', sortKey: undefined },
    {
        text: 'Deadline (Days)',
        itemKey: 'daysUntilProjectDeadline',
        sortKey: SortName.Days,
    },
    {
        text: 'Word Count',
        itemKey: 'wordCount',
        sortKey: SortName.WordCount,
    },
];

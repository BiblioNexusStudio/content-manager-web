import type { column } from '$lib/types/table';
import { SortName } from './dashboard-table-sorters';
import type { ResourceAssignedToSelf, ResourceAssignedToSelfHistory } from './+page';

export const myWorkColumns: column<ResourceAssignedToSelf>[] = [
    { text: 'Title', itemKey: 'englishLabel', sortKey: SortName.Title },
    { text: 'Resource', itemKey: 'parentResourceName', sortKey: undefined },
    { text: 'Last Edit (Days)', itemKey: 'daysSinceContentUpdated', sortKey: undefined },
    { text: 'Days Assigned', itemKey: 'daysSinceAssignment', sortKey: SortName.Days },
    { text: 'Word Count', itemKey: 'wordCount', sortKey: SortName.WordCount },
];

export const myHistoryColumns: column<ResourceAssignedToSelfHistory>[] = [
    { text: 'Title', itemKey: 'englishLabel', sortKey: SortName.Title },
    { text: 'Resource', itemKey: 'parentResourceName', sortKey: undefined },
    { text: 'My Last Action', itemKey: 'lastActionTime', sortKey: SortName.Days },
    { text: 'Source Words', itemKey: 'sourceWords', sortKey: undefined },
];

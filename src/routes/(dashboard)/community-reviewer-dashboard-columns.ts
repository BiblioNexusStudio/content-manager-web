import type { column } from '$lib/types/table';
import { SortName } from './dashboard-table-sorters';
import type { ResourceThatNeedsTranslation, ResourceAssignedToSelfHistory } from './+page';

export const resourcesThatNeedTranslationColumns: column<ResourceThatNeedsTranslation>[] = [
    { text: 'Title', itemKey: 'englishLabel', sortKey: undefined },
    { text: 'Resource', itemKey: 'parentResourceName', sortKey: undefined },
    { text: '', itemKey: 'hasAudio', sortKey: undefined },
    { text: 'Source Words', itemKey: 'wordCount', sortKey: undefined },
];

export const myHistoryColumns: column<ResourceAssignedToSelfHistory>[] = [
    { text: 'Title', itemKey: 'englishLabel', sortKey: SortName.Title },
    { text: 'Resource', itemKey: 'parentResourceName', sortKey: undefined },
    { text: '', itemKey: 'hasAudio', sortKey: undefined },
    { text: 'My Last Action', itemKey: 'lastActionTime', sortKey: SortName.Days },
    { text: 'Source Words', itemKey: 'sourceWords', sortKey: undefined },
];

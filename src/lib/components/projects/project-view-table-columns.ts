import type { column } from '$lib/types/table';
import type { ProjectResource } from '$lib/types/projects';
import { SortName } from './project-view-table-sorter';

export const projectViewTableColumns: column<ProjectResource>[] = [
    { itemKey: 'englishLabel', text: 'Title', sortKey: SortName.Title },
    { itemKey: 'parentResourceName', text: 'Resource', sortKey: undefined },
    { itemKey: 'assignedUserName', text: 'Assigned', sortKey: SortName.Assigned },
    { itemKey: 'statusDisplayName', text: 'Status', sortKey: SortName.Status },
    { itemKey: 'wordCount', text: 'Source Words', sortKey: SortName.WordCount },
];

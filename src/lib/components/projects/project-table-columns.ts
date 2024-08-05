import type { column } from '$lib/types/table';
import type { ProjectListResponse } from '$lib/types/projects';
import { SortName } from './project-table-sorter';

export const projectTableColumns: column<ProjectListResponse>[] = [
    { itemKey: 'name', text: 'Title', sortKey: SortName.Title },
    { itemKey: 'company', text: 'Company', sortKey: SortName.Company },
    { itemKey: 'projectPlatform', text: 'Platform', sortKey: SortName.Platform },
    { itemKey: 'resource', text: 'Resource', sortKey: SortName.Resource },
    { itemKey: 'language', text: 'Language', sortKey: SortName.Language },
    { itemKey: 'projectLead', text: 'Project Lead', sortKey: undefined },
    { itemKey: 'itemCount', text: 'Items', sortKey: SortName.Items },
    { itemKey: 'wordCount', text: 'Source Words', sortKey: SortName.SourceWords },
    { itemKey: 'days', text: 'Days', sortKey: SortName.Days },
    { text: 'Progress', sortKey: undefined },
];

export const projectTableColumnsWithManager: column<ProjectListResponse>[] = [
    { itemKey: 'name', text: 'Title', sortKey: SortName.Title },
    { itemKey: 'company', text: 'Company', sortKey: SortName.Company },
    { itemKey: 'projectPlatform', text: 'Platform', sortKey: SortName.Platform },
    { itemKey: 'resource', text: 'Resource', sortKey: SortName.Resource },
    { itemKey: 'language', text: 'Language', sortKey: SortName.Language },
    { itemKey: 'manager', text: 'Manager', sortKey: undefined },
    { itemKey: 'itemCount', text: 'Items', sortKey: SortName.Items },
    { itemKey: 'wordCount', text: 'Source Words', sortKey: SortName.SourceWords },
    { itemKey: 'days', text: 'Days', sortKey: SortName.Days },
    { text: 'Progress', sortKey: undefined },
];

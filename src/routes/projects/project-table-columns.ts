import type { column } from '$lib/types/table';
import type { ProjectListResponse } from '$lib/types/projects';

export const projectTableColumns: column<ProjectListResponse>[] = [
    { itemKey: 'name', text: 'Title', sortKey: undefined },
    { itemKey: 'company', text: 'Company', sortKey: undefined },
    { itemKey: 'projectPlatform', text: 'Platform', sortKey: undefined },
    { itemKey: 'resource', text: 'Resource', sortKey: undefined },
    { itemKey: 'language', text: 'Language', sortKey: undefined },
    { itemKey: 'projectLead', text: 'Project Lead', sortKey: undefined },
    { itemKey: 'itemCount', text: 'Items', sortKey: undefined },
    { itemKey: 'wordCount', text: 'Source Words', sortKey: undefined },
    { itemKey: 'days', text: 'Days', sortKey: undefined },
    { text: 'Progress', sortKey: undefined },
];

export const projectTableColumnsWithManager: column<ProjectListResponse>[] = [
    { itemKey: 'name', text: 'Title', sortKey: undefined },
    { itemKey: 'company', text: 'Company', sortKey: undefined },
    { itemKey: 'projectPlatform', text: 'Platform', sortKey: undefined },
    { itemKey: 'resource', text: 'Resource', sortKey: undefined },
    { itemKey: 'language', text: 'Language', sortKey: undefined },
    { itemKey: 'manager', text: 'Manager', sortKey: undefined },
    { itemKey: 'itemCount', text: 'Items', sortKey: undefined },
    { itemKey: 'wordCount', text: 'Source Words', sortKey: undefined },
    { itemKey: 'days', text: 'Days', sortKey: undefined },
    { text: 'Progress', sortKey: undefined },
];

import { createListSorter } from '$lib/utils/sorting';
import type { ProjectListResponse } from '$lib/types/projects';

export enum SortName {
    Title = 'title',
    Company = 'company',
    Platform = 'platform',
    Resource = 'resource',
    Language = 'language',
    Manager = 'manager',
    ProjectLead = 'projectLead',
    Items = 'items',
    Days = 'days',
    SourceWords = 'wordCount',
}

export function createProjectListSorter<T extends ProjectListResponse>() {
    return createListSorter<T>({
        [SortName.Title]: {
            primarySortKeys: ['name'],
        },
        [SortName.Company]: {
            primarySortKeys: ['company'],
        },
        [SortName.Platform]: {
            primarySortKeys: ['projectPlatform'],
        },
        [SortName.Resource]: {
            primarySortKeys: ['resource'],
        },
        [SortName.Language]: {
            primarySortKeys: ['language'],
        },
        [SortName.Manager]: {
            primarySortKeys: ['manager'],
        },
        [SortName.ProjectLead]: {
            primarySortKeys: ['projectLead'],
        },
        [SortName.Items]: {
            primarySortKeys: ['itemCount'],
        },
        [SortName.Days]: {
            primarySortKeys: ['daysForSorting'],
        },
    });
}

import { createListSorter } from '$lib/utils/sorting';
import type { ProjectResource } from '$lib/types/projects';

export enum SortName {
    Title = 'englishLabel',
    Assigned = 'assignedUserName',
    Status = 'statusDisplayName',
    WordCount = 'wordCount',
}

export function createProjectViewListSorter<T extends ProjectResource>() {
    return createListSorter<T>({
        [SortName.Title]: {
            primarySortKeys: ['englishLabel'],
        },
        [SortName.Assigned]: {
            primarySortKeys: ['assignedUserName'],
        },
        [SortName.Status]: {
            primarySortKeys: ['statusDisplayName'],
        },
        [SortName.WordCount]: {
            primarySortKeys: ['wordCount'],
        },
    });
}

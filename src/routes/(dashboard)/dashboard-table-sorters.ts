import { createListSorter } from '$lib/utils/sorting';
import type {
    Project,
    ResourceAssignedToSelf,
    ResourceAssignedToSelfHistory,
    ResourcePendingReview,
    UserWordCount,
} from './+page';

export enum SortName {
    Days = 'days',
    WordCount = 'word-count',
    Title = 'title',
    Language = 'language',
    User = 'user',
}

export function createManagerDashboardSorter<T extends ResourceAssignedToSelf>() {
    return createListSorter<T>({
        [SortName.Days]: {
            primarySortKeys: ['daysUntilProjectDeadline'],
            fallbackSortKeys: [
                { key: 'projectName', dir: 'ASC' },
                { key: 'sortOrder', dir: 'ASC' },
                { key: 'englishLabel', dir: 'ASC' },
            ],
        },
        [SortName.WordCount]: {
            primarySortKeys: ['wordCount'],
            fallbackSortKeys: [
                { key: 'sortOrder', dir: 'ASC' },
                { key: 'englishLabel', dir: 'ASC' },
            ],
        },
        [SortName.Title]: {
            primarySortKeys: ['sortOrder', 'englishLabel'],
        },
    });
}

export function createEditorDashboardMyWorkSorter() {
    return createListSorter<ResourceAssignedToSelf>({
        [SortName.Days]: {
            primarySortKeys: ['daysSinceAssignment'],
            fallbackSortKeys: [
                { key: 'sortOrder', dir: 'ASC' },
                { key: 'englishLabel', dir: 'ASC' },
            ],
        },
        [SortName.WordCount]: {
            primarySortKeys: ['wordCount'],
            fallbackSortKeys: [
                { key: 'sortOrder', dir: 'ASC' },
                { key: 'englishLabel', dir: 'ASC' },
            ],
        },
        [SortName.Title]: {
            primarySortKeys: ['sortOrder', 'englishLabel'],
        },
    });
}

export function createEditorDashboardMyHistorySorter() {
    return createListSorter<ResourceAssignedToSelfHistory>({
        [SortName.Days]: {
            primarySortKeys: ['lastActionTime'],
            fallbackSortKeys: [
                { key: 'sortOrder', dir: 'ASC' },
                { key: 'englishLabel', dir: 'ASC' },
            ],
        },
        [SortName.WordCount]: {
            primarySortKeys: ['sourceWords'],
            fallbackSortKeys: [
                { key: 'sortOrder', dir: 'ASC' },
                { key: 'englishLabel', dir: 'ASC' },
            ],
        },
        [SortName.Title]: {
            primarySortKeys: ['sortOrder', 'englishLabel'],
        },
    });
}

export function createPublisherDashboardMyWorkSorter() {
    return createListSorter<ResourceAssignedToSelf>({
        [SortName.Days]: {
            primarySortKeys: ['daysSinceAssignment'],
            fallbackSortKeys: [
                { key: 'sortOrder', dir: 'ASC' },
                { key: 'englishLabel', dir: 'ASC' },
            ],
        },
        [SortName.WordCount]: {
            primarySortKeys: ['wordCount'],
            fallbackSortKeys: [
                { key: 'sortOrder', dir: 'ASC' },
                { key: 'englishLabel', dir: 'ASC' },
            ],
        },
        [SortName.Title]: {
            primarySortKeys: ['sortOrder', 'englishLabel'],
        },
        [SortName.Language]: {
            primarySortKeys: ['languageEnglishDisplay'],
            fallbackSortKeys: [
                { key: 'sortOrder', dir: 'ASC' },
                { key: 'englishLabel', dir: 'ASC' },
            ],
        },
    });
}

export function createPublisherDashboardReviewPendingSorter() {
    return createListSorter<ResourcePendingReview>({
        [SortName.Days]: {
            primarySortKeys: ['daysSinceStatusChange'],
            fallbackSortKeys: [
                { key: 'sortOrder', dir: 'ASC' },
                { key: 'englishLabel', dir: 'ASC' },
            ],
        },
        [SortName.WordCount]: {
            primarySortKeys: ['wordCount'],
            fallbackSortKeys: [
                { key: 'sortOrder', dir: 'ASC' },
                { key: 'englishLabel', dir: 'ASC' },
            ],
        },
        [SortName.Title]: {
            primarySortKeys: ['sortOrder', 'englishLabel'],
        },
        [SortName.Language]: {
            primarySortKeys: ['languageEnglishDisplay'],
            fallbackSortKeys: [
                { key: 'sortOrder', dir: 'ASC' },
                { key: 'englishLabel', dir: 'ASC' },
            ],
        },
    });
}

export function createPublisherDashboardProjectsSorter() {
    return createListSorter<Project>({
        [SortName.Days]: { primarySortKeys: ['days'], fallbackSortKeys: [{ key: 'name', dir: 'ASC' }] },
    });
}

export function createUserWordCountSorter() {
    return createListSorter<UserWordCount>({
        [SortName.WordCount]: { primarySortKeys: ['assignedSourceWordCount'] },
        [SortName.User]: { primarySortKeys: ['userName'] },
    });
}

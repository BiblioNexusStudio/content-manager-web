import { createListSorter } from '$lib/utils/sorting';
import type { Project, ResourceAssignedToSelf, ResourcePendingReview } from '../../routes/+page';

enum ColumnName {
    Days = 'days',
    WordCount = 'word-count',
    Title = 'title',
    Language = 'language',
}

export function createManagerDashboardSorter<T extends ResourceAssignedToSelf>() {
    return createListSorter<T>(
        {
            [ColumnName.Days]: 'daysUntilProjectDeadline',
            [ColumnName.WordCount]: 'wordCount',
        },
        [
            { key: 'projectName', dir: 'ASC' },
            { key: 'sortOrder', dir: 'ASC' },
        ]
    );
}

export function createEditorDashboardSorter() {
    return createListSorter<ResourceAssignedToSelf>(
        {
            [ColumnName.Days]: 'daysSinceAssignment',
            [ColumnName.WordCount]: 'wordCount',
        },
        [{ key: 'sortOrder', dir: 'ASC' }]
    );
}

export function createPublisherDashboardMyWorkSorter() {
    return createListSorter<ResourceAssignedToSelf>(
        {
            [ColumnName.Title]: 'englishLabel',
            [ColumnName.Language]: 'languageEnglishDisplay',
            [ColumnName.Days]: 'daysSinceAssignment',
            [ColumnName.WordCount]: 'wordCount',
        },
        [{ key: 'sortOrder', dir: 'ASC' }]
    );
}

export function createPublisherDashboardReviewPendingSorter() {
    return createListSorter<ResourcePendingReview>(
        {
            [ColumnName.Title]: 'sortOrder',
            [ColumnName.Language]: 'languageEnglishDisplay',
            [ColumnName.Days]: 'daysSinceStatusChange',
            [ColumnName.WordCount]: 'wordCount',
        },
        [{ key: 'sortOrder', dir: 'ASC' }]
    );
}

export function createPublisherDashboardProjectsSorter() {
    return createListSorter<Project>({
        [ColumnName.Days]: 'days',
    });
}

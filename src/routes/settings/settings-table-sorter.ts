import { createListSorter } from '$lib/utils/sorting';
import type { TranslationPair } from '$lib/types/base';

export enum SortName {
    English = 'english',
    TargetLanguage = 'target-language',
}

export function createSettingsTableSorter<T extends TranslationPair>() {
    return createListSorter<T>({
        [SortName.English]: {
            primarySortKeys: ['translationPairKey'],
        },
        [SortName.TargetLanguage]: {
            primarySortKeys: ['translationPairValue'],
        },
    });
}

type SortConfig<T> = {
    [sortName: string]: {
        primarySortKeys: (keyof T)[];
        fallbackSortKeys?: { key: keyof T; dir: 'ASC' | 'DESC' }[];
    };
};

function compareSortValues<T>(a: T, b: T, key: keyof T, isDescending: boolean): number {
    let valueA = a[key];
    let valueB = b[key];

    if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase() as typeof valueA;
    }
    if (typeof valueB === 'string') {
        valueB = valueB.toLowerCase() as typeof valueB;
    }

    if (typeof valueA === 'number' && valueB === null) {
        valueB = 999999999 as T[keyof T];
    }
    if (typeof valueB === 'number' && valueA === null) {
        valueA = 999999999 as T[keyof T];
    }

    if (valueA < valueB) return isDescending ? 1 : -1;
    if (valueA > valueB) return isDescending ? -1 : 1;

    return 0;
}

// Takes in a mapping and returns a function that can be used to sort a list of data.
// The mapping contains the sort name (the name that would be in the URL) mapped to config for the sort, which is the
// property key list the sort applies to as well as fallback sort keys if the primary keys are identical.
//
// Example:
//   type Content = { wordCount: number };
//   const sorter = createListSorter<Content>({ 'word-count': { primarySortKeys: ['wordCount'] } });
//   const list: Content[] = ...;
//   sorter(list, 'word-count'); // would sort by `wordCount` in ascending order
//   sorter(list, '-word-count'); // would sort by `wordCount` in descending order

export function createListSorter<T>(mapping: SortConfig<T>): (list: T[], sort: string) => T[] {
    return (list: T[], sort: string) => {
        const sortName = sort.replace(/^-/, '');
        const isDescending = sort.startsWith('-');
        const sortConfig = mapping[sortName];

        if (!sortConfig) return list;

        return list.sort((a, b) => {
            // Apply primary sort keys
            for (const primaryKey of sortConfig.primarySortKeys) {
                const result = compareSortValues(a, b, primaryKey, isDescending);
                if (result !== 0) return result;
            }

            // Apply fallback sort keys if primary sort values are equal
            for (const { key: fallbackKey, dir } of sortConfig.fallbackSortKeys ?? []) {
                const isFallbackDescending = dir === 'DESC';
                const result = compareSortValues(a, b, fallbackKey, isFallbackDescending);
                if (result !== 0) return result;
            }

            return 0;
        });
    };
}

export function sortByKey<T>(items: T[] | null, key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] | null {
    return sortByKeys(items, [key], direction);
}

export function sortByKeys<T>(items: T[] | null, keys: (keyof T)[], direction: 'asc' | 'desc' = 'asc'): T[] | null {
    if (!items) return null;
    return items.sort((a, b) => {
        for (const key of keys) {
            if (a[key] > b[key]) {
                return direction === 'asc' ? 1 : -1;
            } else if (a[key] < b[key]) {
                return direction === 'asc' ? -1 : 1;
            }
        }
        return 0;
    });
}

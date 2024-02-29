// Takes in a mapping and returns a function that can be used to sort a list of data.
// The mapping contains the sort key name (the name that would be in the URL) mapped to the data attribute name.
//
// Example:
//   type Content = { wordCount: number };
//   const sorter = createListSorter<Content>({ 'word-count': 'wordCount' });
//   const list: Content[] = ...;
//   sorter(list, 'word-count'); // would sort by `wordCount` in ascending order
//   sorter(list, '-word-count'); // would sort by `wordCount` in descending order
export function createListSorter<T>(mapping: { [sortKey: string]: keyof T }): (list: T[], sort: string) => T[] {
    return (list: T[], sort: string) => {
        const key = sort.replace(/^-/, '');
        const isDescending = sort.startsWith('-');
        const sortField = mapping[key];

        if (!sortField) return list;

        return list.sort((a, b) => {
            let valueA = a[sortField];
            let valueB = b[sortField];
            if (typeof valueA === 'string') {
                valueA = valueA.toLowerCase() as typeof valueA;
            }
            if (typeof valueB === 'string') {
                valueB = valueB.toLowerCase() as typeof valueB;
            }

            if (valueA < valueB) return isDescending ? 1 : -1;
            if (valueA > valueB) return isDescending ? -1 : 1;

            return 0;
        });
    };
}

export function sortByKey<T>(items: T[] | null, key: keyof T): T[] | null {
    if (!items) return null;
    return items.sort((a, b) => (a[key] > b[key] ? 1 : -1));
}

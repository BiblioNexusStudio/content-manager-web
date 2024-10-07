// Filter out falsey values from an array (e.g. null, undefined, false, 0, "").
export function filterBoolean<T>(items: (T | undefined | null | false)[] | undefined | null): T[] {
    if (items === null || items === undefined) {
        return [] as T[];
    }
    return items.filter(Boolean) as T[];
}

export function filterDuplicatesByKey<T>(key: keyof T, items: T[]): T[] {
    return items.filter((item, index, self) => index === self.findIndex((p) => p[key] === item[key]));
}

export function sortByKey<T>(key: keyof T, items: T[]): T[] {
    return items.sort((a, b) => {
        if (a[key] > b[key]) return 1;
        else if (b[key] > a[key]) return -1;
        else return 0;
    });
}

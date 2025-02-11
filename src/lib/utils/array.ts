// Filter out falsey values from an array (e.g. null, undefined, false, 0, "").
export function filterBoolean<T>(items: (T | undefined | null | false)[] | undefined | null): T[] {
    if (items === null || items === undefined) {
        return [] as T[];
    }
    return items.filter(Boolean) as T[];
}

// Filter out elements in an array where the values at a given key are falsey (e.g. null, undefined, false, 0, "").
export function filterBooleanByKey<T, K extends keyof T>(
    items: (T | undefined | null)[] | undefined | null,
    key: K
): (T & { [P in K]: NonNullable<T[P]> })[] {
    if (items === null || items === undefined) {
        return [] as (T & { [P in K]: NonNullable<T[P]> })[];
    }
    return items.filter((item): item is T & { [P in K]: NonNullable<T[P]> } => {
        return Boolean(item?.[key]);
    });
}

export async function asyncMap<T, R>(
    array: T[],
    asyncMapper: (element: T, index: number, array: T[]) => Promise<R>
): Promise<R[]> {
    return await Promise.all(array.map(asyncMapper));
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

import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { get } from 'svelte/store';

export interface SearchParam<T extends string | number> {
    default: T;
    value: T;
    key: string;
}

export function initSearchParam<T extends string | number>(url: URL, key: string, defaultValue: T): SearchParam<T> {
    const value = url.searchParams.get(key);
    if (typeof defaultValue === 'number') {
        return {
            default: defaultValue,
            value: value === null ? defaultValue : (parseInt(value) as T),
            key,
        };
    } else {
        return {
            default: defaultValue,
            value: value === null ? defaultValue : (value as T),
            key,
        };
    }
}

export function updateSearchParam<T extends string | number>(searchParam: SearchParam<T>, newValue: T) {
    updateSearchParams([[searchParam, newValue]]);
}

export function onSelectChangeSearchParam<T extends string | number>(searchParam: SearchParam<T>) {
    return (event: Event) => {
        const value = (event.target as HTMLSelectElement).value;
        updateSearchParam(searchParam, typeof searchParam.default === 'number' ? parseInt(value) : value);
    };
}

export function updateSearchParams<T extends string | number>(searchParams: [SearchParam<T>, T][]) {
    const originalUrl = get(page).url.toString();
    const newUrl = new URL(get(page).url);
    searchParams.forEach(([searchParam, newValue]) => {
        if (newValue === searchParam.default) {
            newUrl.searchParams.delete(searchParam.key);
        } else {
            newUrl.searchParams.set(searchParam.key, newValue.toString());
        }
    });
    if (originalUrl !== newUrl.toString()) {
        goto(newUrl.toString());
    }
}

export function urlWithUpdatedSearchParam<T extends string | number>(searchParam: SearchParam<T>, newValue: T): string {
    const newUrl = new URL(get(page).url);
    if (newValue === searchParam.default) {
        newUrl.searchParams.delete(searchParam.key);
    } else {
        newUrl.searchParams.set(searchParam.key, newValue.toString());
    }
    return newUrl.toString();
}

import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { get, writable, type Writable } from 'svelte/store';

export interface SearchParamStore<T extends string | number> extends Writable<T> {
    default: T;
    key: string;
}

export interface SearchParam<T extends string | number> {
    default: T;
    key: string;
}

// Create a search param store that can be bound within Svelte code like:
//   <select bind:value={$searchParam}>
//
// The store can also be passed to `updateSearchParam` or `urlWithUpdatedSearchParam` for programatic usage.
export function createSearchParamStore<T extends string | number>(
    url: URL,
    key: string,
    defaultValue: T
): SearchParamStore<T> {
    const initialValue = url.searchParams.get(key);
    const parsedValue =
        typeof defaultValue === 'number' && initialValue !== null
            ? (parseInt(initialValue) as T)
            : (initialValue as T) || defaultValue;

    const store = writable(parsedValue);
    const { subscribe, set } = store;

    return {
        default: defaultValue,
        key,
        subscribe,
        set: (newValue: T) => {
            updateSearchParam({ default: defaultValue, key }, newValue);
            set(newValue);
        },
        update: (fn: (value: T) => T) => {
            const newValue = fn(get(store));
            updateSearchParam({ default: defaultValue, key }, newValue);
            set(newValue);
        },
    };
}

// Given a search param store and a value, update the URL.
// It clears the search param key if the value is set to its default.
// It also only updates the URL if something changed, preventing unnecessary navigations.
export function updateSearchParam<T extends string | number>(searchParam: SearchParam<T>, newValue: T) {
    const originalUrl = get(page).url.toString();
    const newUrl = urlWithUpdatedSearchParam(searchParam, newValue);
    if (originalUrl !== newUrl) {
        goto(newUrl);
    }
}

// Given a search param store and a value, return the current URL, updated appropriately.
// It clears the search param key if the value is set to its default.
export function urlWithUpdatedSearchParam<T extends string | number>(searchParam: SearchParam<T>, newValue: T): string {
    const newUrl = new URL(get(page).url);
    if (newValue === searchParam.default) {
        newUrl.searchParams.delete(searchParam.key);
    } else {
        newUrl.searchParams.set(searchParam.key, newValue.toString());
    }
    return newUrl.toString();
}

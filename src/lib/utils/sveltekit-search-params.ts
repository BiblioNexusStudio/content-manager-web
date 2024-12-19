// copied from https://github.com/paoloricciuti/sveltekit-search-params/blob/master/src/lib/sveltekit-search-params.ts

import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { get, writable, type Updater, type Writable } from 'svelte/store';

function noop<T>(_value: T) {
    // no-op
}

const GOTO_OPTIONS = {
    keepFocus: true,
    noScroll: true,
    replaceState: true,
};

type EncodeAndDecodeOptions<T> = {
    encode: (value: T) => string | undefined;
    decode: (value: string | null) => T | null;
    defaultValue: T;
};

type LooseAutocomplete<T> = {
    [K in keyof T]: T[K];
} & {
    [K: string]: unknown;
};

type Options<T> = {
    [Key in keyof T]: EncodeAndDecodeOptions<T[Key]>;
};

function objectEntries<T>(obj: T): [keyof T, T[keyof T]][] {
    return Object.entries(obj as object) as [keyof T, T[keyof T]][];
}

function objectKeys<T>(obj: T): (keyof T)[] {
    return Object.keys(obj as object) as (keyof T)[];
}

/**
 * A function that pulls search parameters from a URL based on configuration settings.
 * Meant to be used in `page.ts` files to determine the query params of the loading page.
 *
 * @param url The URL object containing search parameters to parse
 * @param searchParamsConfig Configuration object defining parameter types and default values
 * @returns An object with parsed search parameters, using default values when parameters are not present
 */
export function searchParametersForLoad<
    T extends Record<
        string,
        EncodeAndDecodeOptions<string> | EncodeAndDecodeOptions<number> | EncodeAndDecodeOptions<boolean>
    >,
>(url: URL, searchParamsConfig: T): { [K in keyof T]: Exclude<ReturnType<T[K]['decode']>, null> } {
    const rawSearchParams = url.searchParams;
    return objectEntries(searchParamsConfig).reduce(
        (output, [name, config]) => ({
            ...output,
            [name]:
                rawSearchParams.get(name as string) === null
                    ? config.defaultValue
                    : config.decode(rawSearchParams.get(name as string) as string),
        }),
        {} as { [K in keyof T]: Exclude<ReturnType<T[K]['decode']>, null> }
    );
}

function mixSearchAndOptions<T>(searchParams: URLSearchParams, options?: Options<T>): LooseAutocomplete<T> {
    const uniqueKeys = Array.from(new Set(Array.from(searchParams?.keys?.() || []).concat(Object.keys(options ?? {}))));
    return Object.fromEntries(
        uniqueKeys.map((key) => {
            let fnToCall: EncodeAndDecodeOptions<string | boolean | number>['decode'] = (value) => value;
            const option = options?.[key as keyof Options<T>];
            if (option) {
                fnToCall = option.decode as EncodeAndDecodeOptions<string | boolean | number>['decode'];
            }
            const value = searchParams?.get(key);
            let actualValue;
            if (
                (value === undefined || value === null) &&
                option?.defaultValue !== undefined &&
                option?.defaultValue !== null
            ) {
                actualValue = option.defaultValue;
            } else {
                actualValue = fnToCall(value);
            }
            return [key, actualValue];
        })
    ) as unknown as LooseAutocomplete<T>;
}

/**
 * Utility object containing type-specific encoders and decoders for search parameter handling.
 * Each method returns an object implementing EncodeAndDecodeOptions with appropriate encode/decode functions.
 *
 * @property {Function} number - Handles numeric parameters with string conversion
 * @property {Function} boolean - Handles boolean parameters with string conversion
 * @property {Function} string - Handles string parameters with direct value passing
 */
export const ssp = {
    number: (defaultValue: number) =>
        ({
            encode: (value: number) => value.toString(),
            decode: (value: string | null) => (value ? parseFloat(value) : null),
            defaultValue,
        }) satisfies EncodeAndDecodeOptions<number>,
    boolean: (defaultValue: boolean) =>
        ({
            encode: (value: boolean) => value + '',
            decode: (value: string | null) => value !== null && value !== 'false',
            defaultValue,
        }) satisfies EncodeAndDecodeOptions<boolean>,
    string: (defaultValue: string) =>
        ({
            encode: (value: string | null) => value ?? '',
            decode: (value: string | null) => value,
            defaultValue,
        }) satisfies EncodeAndDecodeOptions<string>,
};

type SetTimeout = ReturnType<typeof setTimeout>;

const batchedUpdates = new Set<(query: URLSearchParams) => void>();

let batchTimeout: SetTimeout;
let debouncedUpdateTimeout: SetTimeout;

export type SubscribedSearchParams<Type> = Type extends Writable<infer X> ? X : never;

/**
 * Creates a writable store that syncs with URL search parameters.
 * The store automatically updates the URL when its value changes and vice versa.
 *
 * Whether the page.ts `load` function will run varies based on your configuration:
 * - When runLoadAgainWhenParamsChange is true, any parameter change triggers a full page.ts#load execution
 * - When it's an array, only changes to specified parameters trigger the load function
 * - Otherwise, only store subscribers are notified of updates, bypassing the load function
 *
 * @template T - The type of the store's value
 * @param {Options<T>} options - Configuration object defining parameter types and default values
 * @param {Object} runLoadConfig - Configuration for page reloading behavior
 * @returns {Writable<LooseAutocomplete<T>>} A writable store with an additional method to calculate URLs with given parameter changes
 */
export function searchParameters<T extends object>(
    options: Options<T>,
    { runLoadAgainWhenParamsChange }: { runLoadAgainWhenParamsChange: boolean | (keyof T)[] }
): Writable<LooseAutocomplete<T>> {
    const { set: _set, subscribe } = writable<LooseAutocomplete<T>>();
    const setRef: { value: Writable<T>['set'] } = { value: noop };
    const unsubPage = page.subscribe(($page) => {
        setRef.value = (value) => {
            clearTimeout(debouncedUpdateTimeout);
            debouncedUpdateTimeout = setTimeout(() => {
                const hash = $page.url.hash;
                const query = new URLSearchParams($page.url.searchParams);
                const toBatch = (query: URLSearchParams) => {
                    for (const field of objectKeys(value)) {
                        if (value[field] === undefined || value[field] === null) {
                            query.delete(field.toString());
                            continue;
                        }
                        let fnToCall: EncodeAndDecodeOptions<string | boolean | number>['encode'] = (value) =>
                            value.toString();
                        const option = field in options ? options[field as keyof T] : null;
                        if (option) {
                            fnToCall = option.encode as EncodeAndDecodeOptions<unknown>['encode'];
                            const newValue = fnToCall(value[field] as unknown as string | number | boolean);
                            if (
                                newValue === undefined ||
                                newValue === null ||
                                newValue === fnToCall(option.defaultValue as unknown as string | number | boolean)
                            ) {
                                query.delete(field as string);
                            } else {
                                query.set(field as string, newValue);
                            }
                        }
                    }
                };
                batchedUpdates.add(toBatch);
                clearTimeout(batchTimeout);
                batchTimeout = setTimeout(async () => {
                    batchedUpdates.forEach((batched) => {
                        batched(query);
                    });
                    const queryAndHash = `?${query}${hash}`;
                    if (
                        runLoadAgainWhenParamsChange === true ||
                        (Array.isArray(runLoadAgainWhenParamsChange) &&
                            runLoadAgainWhenParamsChange.some(
                                (param) =>
                                    query.get(param as string) !==
                                    new URLSearchParams(window.location.search).get(param as string)
                            ))
                    ) {
                        await goto(queryAndHash, GOTO_OPTIONS);
                    } else {
                        history.replaceState(history.state, '', queryAndHash);
                        _set(mixSearchAndOptions(new URLSearchParams(queryAndHash), options));
                    }
                    batchedUpdates.clear();
                });
            }, 50);
        };
        const valueToSet = mixSearchAndOptions($page?.url?.searchParams, options);
        _set(valueToSet);
    });
    const sub = (...props: Parameters<typeof subscribe>) => {
        const unsub = subscribe(...props);
        return () => {
            unsub();
            unsubPage();
        };
    };

    return {
        set: (value) => {
            setRef.value(value);
        },
        subscribe: sub,
        update: (updater: Updater<LooseAutocomplete<T>>) => {
            const currentValue = get({ subscribe });
            const newValue = updater(currentValue);
            setRef.value(newValue);
        },
    };
}

export interface Param {
    key: string;
    value: string | number;
    ignoreIfEquals?: string | number;
}

/**
 * Builds a URL query string from an array of parameters, excluding parameters with values equal to their ignore values.
 *
 * @param {Param[]} params - Array of objects containing key-value pairs and optional ignore values
 * @returns {string} A formatted URL query string
 */
export function buildQueryString(params: Param[]): string {
    const searchParams = new URLSearchParams();

    params.forEach(({ key, value, ignoreIfEquals }) => {
        if (value !== ignoreIfEquals) {
            searchParams.append(key, value.toString());
        }
    });

    return searchParams.toString();
}

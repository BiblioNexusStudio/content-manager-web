// copied from https://github.com/paoloricciuti/sveltekit-search-params/blob/master/src/lib/sveltekit-search-params.ts
// Updates made:
//   - remove unused `queryParam` function in favor of always using the multi-param `searchParameters` (note the rename)
//   - remove search params from the URL if they're set to the default value
//   - require a defaultValue to be set in the options
//   - add `searchParametersForLoad` function to be used in `+page.ts` files
//   - add a 50ms debounce to the update URL functionality to allow reactive changes to the search params without race
//     conditions
//   - add `calculateUrlWithGivenChanges` to the returned store that can be used to set hrefs on links

/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { get, writable, type Updater, type Writable } from 'svelte/store';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function noop<T>(value: T) {}

const GOTO_OPTIONS = {
    keepFocus: true,
    noScroll: true,
    replaceState: true,
};

export type EncodeAndDecodeOptions<T = any> = {
    encode: (value: T) => string | undefined;
    decode: (value: string | null) => T | null;
    defaultValue: T;
};

type LooseAutocomplete<T> = {
    [K in keyof T]: T[K];
} & {
    [K: string]: any;
};

type Options<T> = {
    [Key in keyof T]: EncodeAndDecodeOptions<T[Key]> | boolean;
};

function objectEntries<T>(obj: T): [keyof T, T[keyof T]][] {
    return Object.entries(obj as object) as [keyof T, T[keyof T]][];
}

export function searchParametersForLoad<T extends Record<string, EncodeAndDecodeOptions>>(
    url: URL,
    searchParamsConfig: T
): { [K in keyof T]: Exclude<ReturnType<T[K]['decode']>, null> } {
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
            let fnToCall: EncodeAndDecodeOptions['decode'] = (value) => value;
            const optionsKey = (options as any)?.[key];
            if (typeof optionsKey !== 'boolean' && typeof optionsKey?.decode === 'function') {
                fnToCall = optionsKey.decode;
            }
            const value = searchParams?.get(key);
            let actualValue;
            if (value == undefined && optionsKey?.defaultValue != undefined) {
                actualValue = optionsKey.defaultValue;
            } else {
                actualValue = fnToCall(value);
            }
            return [key, actualValue];
        })
    ) as unknown as LooseAutocomplete<T>;
}

export const ssp = {
    object: <T extends object = any>(defaultValue: T) => ({
        encode: (value: T) => JSON.stringify(value),
        decode: (value: string | null): T | null => {
            if (value === null) return null;
            try {
                return JSON.parse(value);
            } catch (e) {
                return null;
            }
        },
        defaultValue,
    }),
    array: <T = any>(defaultValue: T[]) => ({
        encode: (value: T[]) => JSON.stringify(value),
        decode: (value: string | null): T[] | null => {
            if (value === null) return null;
            try {
                return JSON.parse(value);
            } catch (e) {
                return null;
            }
        },
        defaultValue,
    }),
    number: (defaultValue: number) => ({
        encode: (value: number) => value.toString(),
        decode: (value: string | null) => (value ? parseFloat(value) : null),
        defaultValue,
    }),
    boolean: (defaultValue: boolean) => ({
        encode: (value: boolean) => value + '',
        decode: (value: string | null) => value !== null && value !== 'false',
        defaultValue,
    }),
    string: (defaultValue: string) => ({
        encode: (value: string | null) => value ?? '',
        decode: (value: string | null) => value,
        defaultValue,
    }),
};

type SetTimeout = ReturnType<typeof setTimeout>;

const batchedUpdates = new Set<(query: URLSearchParams) => void>();

let batchTimeout: SetTimeout;
let debouncedUpdateTimeout: SetTimeout;

export type SubscribedSearchParams<Type> = Type extends Writable<infer X> ? X : never;

export function searchParameters<T extends object>(
    options?: Options<T>
): Writable<LooseAutocomplete<T>> & {
    calculateUrlWithGivenChanges: (params: Partial<LooseAutocomplete<T>>) => string;
} {
    const { set: _set, subscribe } = writable<LooseAutocomplete<T>>();
    const setRef: { value: Writable<T>['set'] } = { value: noop };
    const unsubPage = page.subscribe(($page) => {
        setRef.value = (value) => {
            clearTimeout(debouncedUpdateTimeout);
            debouncedUpdateTimeout = setTimeout(() => {
                const hash = $page.url.hash;
                const query = new URLSearchParams($page.url.searchParams);
                const toBatch = (query: URLSearchParams) => {
                    for (const field of Object.keys(value)) {
                        if ((value as any)[field] == undefined) {
                            query.delete(field);
                            continue;
                        }
                        let fnToCall: EncodeAndDecodeOptions['encode'] = (value) => value.toString();
                        const optionsKey = (options as any)?.[field as string];
                        if (typeof optionsKey !== 'boolean' && typeof optionsKey?.encode === 'function') {
                            fnToCall = optionsKey.encode;
                        }
                        const newValue = fnToCall((value as any)[field]);
                        if (newValue == undefined || newValue === fnToCall(optionsKey.defaultValue)) {
                            query.delete(field as string);
                        } else {
                            query.set(field as string, newValue);
                        }
                    }
                };
                batchedUpdates.add(toBatch);
                clearTimeout(batchTimeout);
                batchTimeout = setTimeout(async () => {
                    batchedUpdates.forEach((batched) => {
                        batched(query);
                    });
                    await goto(`?${query}${hash}`, GOTO_OPTIONS);
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

    function calculateUrlWithGivenChanges(params: Partial<LooseAutocomplete<T>>): string {
        const currentUrl = new URL(get(page).url);
        const searchParams = new URLSearchParams(currentUrl.searchParams);

        Object.entries(params).forEach(([key, value]) => {
            // eslint-disable-next-line
            // @ts-ignore
            const option = options[key];
            let encodedValue;
            if (typeof option === 'boolean') {
                encodedValue = value && value.toString();
            } else {
                encodedValue = option.encode(value);
            }
            if (encodedValue === option.encode(option.defaultValue)) {
                searchParams.delete(key);
            } else {
                searchParams.set(key, encodedValue);
            }
        });

        currentUrl.search = searchParams.toString();
        return currentUrl.toString();
    }

    return {
        set: (value) => {
            setRef.value(value);
        },
        calculateUrlWithGivenChanges,
        subscribe: sub,
        update: (updater: Updater<LooseAutocomplete<T>>) => {
            const currentValue = get({ subscribe });
            const newValue = updater(currentValue);
            setRef.value(newValue);
        },
    };
}

interface Param {
    key: string;
    value: string | number;
    ignoreIfEquals?: string | number;
}

export function buildQueryString(params: Param[]): string {
    const searchParams = new URLSearchParams();

    params.forEach(({ key, value, ignoreIfEquals }) => {
        if (value !== ignoreIfEquals) {
            searchParams.append(key, value.toString());
        }
    });

    return searchParams.toString();
}

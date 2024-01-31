import { type Writable, writable, derived } from 'svelte/store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const listData: Writable<any> = writable([]);

export const paginationStart: Writable<number> = writable(0);
export const paginationEnd: Writable<number> = writable(100);

export const currentListData = derived(
    [listData, paginationStart, paginationEnd],
    ([$listData, $paginationStart, $paginationEnd]) => {
        return $listData.slice($paginationStart, $paginationEnd);
    }
);

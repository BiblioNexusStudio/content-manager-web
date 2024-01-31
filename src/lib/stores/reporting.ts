import { type Writable, writable, derived } from 'svelte/store';
import type { GenericReportRow } from '$lib/types/reporting';

export const listData: Writable<GenericReportRow[]> = writable([]);

export const paginationStart: Writable<number> = writable(0);
export const paginationEnd: Writable<number> = writable(100);

export const currentListData = derived(
    [listData, paginationStart, paginationEnd],
    ([$listData, $paginationStart, $paginationEnd]) => {
        return $listData.slice($paginationStart, $paginationEnd);
    }
);

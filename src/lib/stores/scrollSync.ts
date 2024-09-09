import { writable } from 'svelte/store';

export const scrollPosition = writable<number>(0);
export const isScrollSyncEnabled = writable<boolean>(true);
export const scrollSyncSourceDiv = writable<HTMLDivElement | undefined>();

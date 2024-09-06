import { writable } from 'svelte/store';

export const scrollPosition = writable(0);
export const isSyncScrollEnabled = writable(true);
export const isSyncScrollPercent = writable(false);

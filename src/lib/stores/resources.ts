import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const languageId = writable<number>(1);

const storedPerPage = (browser && localStorage.getItem('resourcesPerPage')) || 10;

export const resourcesPerPage = writable<number>(+storedPerPage);

resourcesPerPage.subscribe((val) => {
    if (browser) localStorage.setItem('resourcesPerPage', String(val));
});

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const storedPerPage = (browser && localStorage.getItem('resourcesPerPage')) || 100;

export const resourcesPerPage = writable<number>(+storedPerPage);

resourcesPerPage.subscribe((val) => {
    if (browser) localStorage.setItem('resourcesPerPage', String(val));
});

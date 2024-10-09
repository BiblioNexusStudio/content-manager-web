import { writable } from 'svelte/store';

export const isLeftToRight = writable<boolean>((localStorage.getItem('isLeftToRight') || 'true') === 'true');

isLeftToRight.subscribe((value) => {
    localStorage.setItem('isLeftToRight', value ? 'true' : 'false');
});

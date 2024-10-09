import { writable } from 'svelte/store';

export const isEditorPaneOnLeft = writable<boolean>((localStorage.getItem('isEditorPaneOnLeft') || 'true') === 'true');

isEditorPaneOnLeft.subscribe((value) => {
    localStorage.setItem('isEditorPaneOnLeft', value ? 'true' : 'false');
});

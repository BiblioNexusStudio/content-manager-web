import { writable } from 'svelte/store';

export const isEditorPaneOnLeft = writable<boolean>((localStorage.getItem('isEditorPaneOnLeft') || 'false') === 'true');

isEditorPaneOnLeft.subscribe((value) => {
    localStorage.setItem('isEditorPaneOnLeft', value ? 'true' : 'false');
});

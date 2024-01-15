import { type Writable, writable, get } from 'svelte/store';
import type { JSONContent } from '@tiptap/core';

export const originalValues: Writable<TiptapContentValues> = writable({
    content: undefined,
    wordCounts: null,
    displayName: undefined,
});

export const updatedValues: Writable<TiptapContentValues> = writable({
    content: undefined,
    wordCounts: null,
    displayName: undefined,
});

export const currentStepNumber: Writable<number> = writable(1, (set) => set(1));

export const updateValues = (values: TiptapContentValues) => {
    updatedValues.update((x) => ({ ...x, ...values }));
};

export const setOriginalValues = (values: TiptapContentValues) => {
    originalValues.update((x) => ({ ...x, ...values }));
    const json = JSON.stringify(values);
    const clone = JSON.parse(json);
    updateValues(clone);
};

export const updateOriginal = () => {
    originalValues.set(JSON.parse(JSON.stringify(get(updatedValues))));
};

export const userStoppedEditing = writable(false);

export interface TiptapContentValues {
    content?: TiptapContentItemValues[] | undefined;
    displayName?: string | undefined;
    wordCounts?: number[] | null;
}

export interface TiptapContentItemValues {
    tiptap?: JSONContent | undefined;
    stepNumber?: number | undefined;
}

﻿import { type Writable, writable, get } from 'svelte/store';
import type { JSONContent } from '@tiptap/core';

export const originalValues: Writable<TiptapContentValues> = writable({
    contentId: undefined,
    content: undefined,
    wordCounts: [],
    displayName: undefined,
});

export const updatedValues: Writable<TiptapContentValues> = writable({
    contentId: undefined,
    content: undefined,
    wordCounts: [],
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
    contentId?: number | undefined;
    content?: TiptapContentItemValues[] | undefined;
    displayName?: string | undefined;
    wordCounts?: number[];
}

export interface TiptapContentItemValues {
    tiptap?: JSONContent | undefined;
    stepNumber?: number | undefined;
}

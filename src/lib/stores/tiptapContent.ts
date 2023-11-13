import { type Writable, writable, get } from 'svelte/store';
import type { JSONContent } from '@tiptap/core';

export const originalValues: Writable<TiptapContentValues> = writable({
    contentId: undefined,
    content: undefined,
    status: undefined,
    label: undefined,
});

export const updatedValues: Writable<TiptapContentValues> = writable({
    contentId: undefined,
    content: undefined,
    status: undefined,
    label: undefined,
});

export const updateValues = (values: TiptapContentValues) => {
    updatedValues.update((x) => ({ ...x, ...values }));
};

export const setOriginalValues = (values: TiptapContentValues) => {
    originalValues.update((x) => ({ ...x, ...values }));
    updateValues(values);
};

export const resetUpdated = () => {
    updatedValues.set(get(originalValues));
};

export const updateOriginal = () => {
    originalValues.set(get(updatedValues));
};

interface TiptapContentValues {
    contentId?: number | undefined;
    content?: JSONContent | undefined;
    label?: string | undefined;
    status?: string | undefined;
}

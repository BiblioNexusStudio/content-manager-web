import { type Writable, writable, get } from 'svelte/store';
import type { JSONContent } from '@tiptap/core';

export const originalValues: Writable<
    { content: JSONContent | undefined; status: string | undefined; label: string | undefined } | undefined
> = writable(undefined);
export const updatedValues: Writable<
    { content: JSONContent | undefined; status: string | undefined; label: string | undefined } | undefined
> = writable(undefined);

export const updateContent = (content: JSONContent) => {
    updatedValues.update((x) => ({
        content: content,
        label: x?.label,
        status: x?.status,
    }));
};

export const updateLabel = (label: string) => {
    updatedValues.update((x) => ({
        content: x?.content,
        label: label,
        status: x?.status,
    }));
};

export const updateStatus = (status: string) => {
    updatedValues.update((x) => ({
        content: x?.content,
        label: x?.label,
        status: status,
    }));
};

export const setOriginalContent = (content: JSONContent) => {
    originalValues.update((x) => ({
        content: content,
        label: x?.label,
        status: x?.status,
    }));
};

export const setOriginalLabel = (label: string) => {
    originalValues.update((x) => ({
        content: x?.content,
        label: label,
        status: x?.status,
    }));
};

export const setOriginalStatus = (status: string) => {
    originalValues.update((x) => ({
        content: x?.content,
        label: x?.label,
        status: status,
    }));
};

export const reset = () => {
    updatedValues.set(get(originalValues));
};

import { type Writable, writable, get } from 'svelte/store';
import type { JSONContent } from '@tiptap/core';
import type { ResourceContent } from '$lib/types/resources';

export const originalValues: Writable<Record<number, TiptapContentValues>> = writable({});

export const updatedValues: Writable<Record<number, TiptapContentValues>> = writable({});

export const currentStepNumber: Writable<number> = writable(1, (set) => set(1));

export const updateValues = (contentVersionId: number, values: TiptapContentValues) => {
    updatedValues.update((existing) => ({
        ...existing,
        [contentVersionId]: { ...existing[contentVersionId], ...values },
    }));
};

export const setOriginalValues = (resourceContent: ResourceContent) => {
    originalValues.set(
        Object.fromEntries(
            resourceContent.contentVersions.map((version) => {
                return [
                    version.id,
                    {
                        displayName: version.displayName,
                        content: version.content as unknown as TiptapContentItemValues[],
                    },
                ];
            })
        )
    );
    updatedValues.set(
        Object.fromEntries(
            resourceContent.contentVersions.map((version) => {
                return [
                    version.id,
                    {
                        displayName: version.displayName,
                        content: version.content as unknown as TiptapContentItemValues[],
                    },
                ];
            })
        )
    );
};

export const setUpdatedTiptapAndWordCountsByIndex = (
    contentVersionId: number,
    index: number,
    newTiptapJson: JSONContent,
    newWordCount: number
) => {
    updatedValues.update((existing) => {
        let wordCounts = existing[contentVersionId]?.wordCounts;
        wordCounts ||= [];
        wordCounts[index] = newWordCount;
        return {
            ...existing,
            [contentVersionId]: {
                ...existing[contentVersionId],
                content: existing[contentVersionId]?.content?.map((item, idx) =>
                    idx === index ? { ...item, tiptap: newTiptapJson } : item
                ),
                wordCounts,
            },
        };
    });
};

export const setOriginalTiptapAndWordCountsByIndex = (
    contentVersionId: number,
    index: number,
    newTiptapJson: JSONContent,
    newWordCount: number
) => {
    originalValues.update((existing) => {
        let wordCounts = existing[contentVersionId]?.wordCounts;
        wordCounts ||= [];
        wordCounts[index] = newWordCount;
        return {
            ...existing,
            [contentVersionId]: {
                ...existing[contentVersionId],
                content: existing[contentVersionId]?.content?.map((item, idx) =>
                    idx === index ? { ...item, tiptap: newTiptapJson } : item
                ),
                wordCounts,
            },
        };
    });
};

export const updateOriginal = (contentVersionId: number) => {
    originalValues.update((existing) => ({
        ...existing,
        [contentVersionId]: { ...existing[contentVersionId], ...get(updatedValues)[contentVersionId] },
    }));
};

export const userStoppedEditing: Writable<Record<string, boolean>> = writable({});

export interface TiptapContentValues {
    content?: TiptapContentItemValues[] | undefined;
    displayName?: string | undefined;
    wordCounts?: number[] | null;
}

export interface TiptapContentItemValues {
    tiptap?: JSONContent | undefined;
    stepNumber?: number | undefined;
}

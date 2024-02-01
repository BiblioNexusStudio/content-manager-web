import { type Writable, writable, get } from 'svelte/store';
import type { JSONContent } from '@tiptap/core';
import type { ResourceContent } from '$lib/types/resources';

export const originalValues: Writable<Record<string, TiptapContentValues>> = writable({});

export const updatedValues: Writable<Record<string, TiptapContentValues>> = writable({});

export const currentStepNumber: Writable<number> = writable(1, (set) => set(1));

// This is to give a unique id to each content version for now, until we can update the API
// to send the real content version down
export function fakeContentVersionId(resourceContent: ResourceContent, versionIndex: number) {
    return `${resourceContent.resourceContentId}.${versionIndex}`;
}

export const updateValues = (contentVersionId: string, values: TiptapContentValues) => {
    updatedValues.update((existing) => ({
        ...existing,
        [contentVersionId]: { ...existing[contentVersionId], ...values },
    }));
};

export const setOriginalValues = (resourceContent: ResourceContent) => {
    originalValues.set(
        Object.fromEntries(
            resourceContent.contentVersions.map((version, index) => {
                return [
                    fakeContentVersionId(resourceContent, index),
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
            resourceContent.contentVersions.map((version, index) => {
                return [
                    fakeContentVersionId(resourceContent, index),
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
    contentVersionId: string,
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
    contentVersionId: string,
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

export const updateOriginal = (contentVersionId: string) => {
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

import { derived, type Writable, writable } from 'svelte/store';
import type { CommentThread } from '$lib/types/base';

export const commentThreads: Writable<CommentThread[]> = writable([]);
export const activeThreadId: Writable<number | null> = writable(null);
export const createNewThreadCallback: Writable<(created: boolean, threadId: number) => void> = writable(() => {
    return;
});
export const removeCommentMarks: Writable<(threadId: number) => void> = writable(() => {
    return;
});

export const activeThread = derived([commentThreads, activeThreadId], ([$commentThreads, $activeThreadId]) => {
    return $commentThreads?.find((x) => x.id === $activeThreadId);
});

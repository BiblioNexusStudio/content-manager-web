import { derived, type Writable, writable } from 'svelte/store';
import type { CommentThreadsResponse, CommentMark } from '$lib/types/comments';

export const commentThreads: Writable<CommentThreadsResponse | null> = writable(null);
export const activeThreadId: Writable<number | null> = writable(null);
export const commentMarks: Writable<CommentMark[]> = writable([]);
export const createNewThreadCallback: Writable<(created: boolean, threadId: number, hasError: boolean) => void> =
    writable(() => {
        return;
    });

export const activeThread = derived([commentThreads, activeThreadId], ([$commentThreads, $activeThreadId]) => {
    return $commentThreads?.threads.find((x) => x.id === $activeThreadId);
});

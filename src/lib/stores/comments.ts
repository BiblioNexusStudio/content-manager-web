import { derived, type Readable, type Writable, writable } from 'svelte/store';
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

export const removeAllInlineThreads: Readable<() => void> = derived([commentMarks], ([$commentMarks]) => {
    return () => {
        for (let i = 0; i < $commentMarks.length; i++) {
            const editor = $commentMarks[i]?.editor;
            editor?.chain().focus('all').unsetMark('comments').focus('start').run();
        }
    };
});

import { derived, type Readable, type Writable, writable } from 'svelte/store';
import type { CommentThreadsResponse, CommentMark } from '$lib/types/comments';

export type CommentStores = ReturnType<typeof createCommentStores>;

export function createCommentStores() {
    const commentThreads: Writable<CommentThreadsResponse | null> = writable(null);
    const commentMarks: Writable<CommentMark[]> = writable([]);
    const sidebarParentDivs: Writable<{ threadId: number; div: HTMLDivElement; click: () => void }[]> = writable([]);

    const createNewThread: Writable<(created: boolean, threadId: number, hasError: boolean) => void> = writable(() => {
        return;
    });

    const removeAllInlineThreads: Readable<() => void> = derived([commentMarks], ([$commentMarks]) => {
        return () => {
            for (let i = 0; i < $commentMarks.length; i++) {
                const editor = $commentMarks[i]?.editor;
                editor?.chain().focus('all').unsetMark('comments').focus('start').run();
            }
        };
    });

    return {
        commentThreads,
        commentMarks,
        createNewThread,
        removeAllInlineThreads,
        sidebarParentDivs,
    };
}

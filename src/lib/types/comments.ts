import type { BasicUser } from '$lib/types/base';
import type { Editor } from '@tiptap/core';

export interface CommentThreadsResponse {
    threadTypeId: number;
    threads: CommentThread[];
}

export interface CommentThread {
    id: number;
    resolved: boolean;
    comments: Comment[];
}

export interface Comment {
    id: number;
    comment: string;
    dateTime: string;
    user: BasicUser;
}

export interface CreateThreadResponse {
    threadId: number;
    commentId: number;
}

export interface CommentMark {
    editor: Editor | undefined;
    threadId: number;
    spanId: string;
}

import { Mark, type SingleCommands } from '@tiptap/core';
import { v4 as uuid } from 'uuid';
import type { EditorState } from '@tiptap/pm/state';
import type { CommentStores } from '$lib/stores/comments';
interface CommentsMarkOptions {
    render: boolean;
    commentStores: CommentStores | undefined;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        comments: {
            setComments: (attributes?: { threadId: number }) => ReturnType;
            unsetComments: () => ReturnType;
        };
    }
}

export const commentsMark = Mark.create<CommentsMarkOptions>({
    name: 'comments',
    priority: 1001,
    keepOnSplit: false,
    excludes: '',
    addAttributes() {
        return {
            comments: {
                default: [
                    {
                        threadId: null,
                    },
                ],
            },
        };
    },
    parseHTML() {
        return [
            {
                tag: 'span',
                getAttrs: (node) => {
                    const bnType = (node as HTMLElement).getAttribute('data-bnType');
                    if (bnType === 'comments') {
                        return {
                            comments: {
                                threadId: (node as HTMLElement).getAttribute('data-threadId'),
                            },
                        };
                    }

                    return false;
                },
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        if (!this.options.render || !this.options.commentStores) {
            return [
                'span',
                {
                    class: 'ignore-diff',
                },
                0,
            ];
        }

        const threadId = HTMLAttributes.comments.threadId;
        const spanId = `thread-${threadId === -1 ? 'temp' : uuid()}`;

        const { commentMarks } = this.options.commentStores;
        commentMarks.update((x) => {
            const existing = x.find((x) => x.threadId === threadId);
            if (existing) {
                existing.editor = this.editor;
                existing.spanId = spanId;
            } else {
                x.push({
                    threadId: parseInt(threadId),
                    editor: this.editor,
                    spanId,
                });
            }

            return x;
        });

        return [
            'span',
            {
                id: spanId,
                'data-bnType': 'comments',
                'data-threadId': HTMLAttributes.comments.threadId,
                class: 'bg-primary/20 rounded inline-comment-span',
                onClick: `onInlineCommentClick(${threadId}, '${spanId}')`,
            },
            0,
        ];
    },
    addCommands() {
        return {
            setComments:
                (attributes) =>
                ({ commands }: { state: EditorState; commands: SingleCommands }) => {
                    return commands.setMark(this.name, { comments: attributes });
                },
            unsetComments:
                () =>
                ({ commands }: { commands: SingleCommands }) => {
                    return commands.unsetMark(this.name, { extendEmptyMarkRange: true });
                },
        };
    },
});

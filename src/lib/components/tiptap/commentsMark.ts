import { Mark, type SingleCommands } from '@tiptap/core';
import { v4 as uuid } from 'uuid';
import type { EditorState } from '@tiptap/pm/state';
import { commentMarks } from '$lib/stores/comments';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        comments: {
            setComments: (attributes?: { threadId: number }) => ReturnType;
            unsetComments: () => ReturnType;
        };
    }
}

export const commentsMark = Mark.create({
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
        const threadId = HTMLAttributes.comments.threadId;
        const spanId = `thread-${threadId === -1 ? 'temp' : uuid()}`;

        commentMarks.update((x) => {
            const existing = x.find((x) => x.threadId === threadId);
            if (existing) {
                existing.editor = this.editor;
            } else {
                x.push({
                    threadId: parseInt(threadId),
                    editor: this.editor,
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
                class: 'bg-primary/40 rounded',
                onClick: `onInlineCommentClick(event, ${threadId}, '${spanId}')`,
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

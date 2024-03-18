import { getMarkAttributes, Mark, type SingleCommands } from '@tiptap/core';
import type { EditorState } from '@tiptap/pm/state';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        comments: {
            setComments: (attributes?: { threadId: number }) => ReturnType;
            unsetComments: () => ReturnType;
        };
    }
}

const onClick = (threadId: number) => {
    alert('hi ' + threadId);
};

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
        console.log(this);
        const threadId = HTMLAttributes.comments.threadId;

        return [
            'span',
            {
                id: `thread-span-${threadId}`,
                'data-bnType': 'comments',
                'data-threadId': HTMLAttributes.comments.threadId,
                class: 'bg-primary/40',
                onClick: `onInlineCommentClick(${threadId})`,
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
                    return commands.unsetMark(this.name);
                },
        };
    },
});

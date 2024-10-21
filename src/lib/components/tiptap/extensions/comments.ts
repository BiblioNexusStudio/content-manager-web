import type { SingleCommands } from 'aquifer-tiptap';
import { v4 as uuid } from 'uuid';
import type { EditorState } from '@tiptap/pm/state';
import type { CommentStores } from '$lib/stores/comments';
import { Comments } from 'aquifer-tiptap';

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

export default Comments.extend<CommentsMarkOptions>({
    addOptions() {
        return {
            ...this.parent?.(),
            render: false,
            commentStores: undefined,
        };
    },
    renderHTML(args) {
        // use the aquifer-tiptap Comments renderer and add more to it
        const parentRender = this.parent?.(args);
        if (parentRender && Array.isArray(parentRender) && parentRender[1]) {
            if (!this.options.render || !this.options.commentStores) {
                parentRender[1].class = 'ignore-diff';
                return parentRender;
            }

            const threadId = args.HTMLAttributes.comments.threadId;
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

            parentRender[1].id = spanId;
            parentRender[1].class = 'bg-primary/20 rounded inline-comment-span';
            parentRender[1].onClick = `onInlineCommentClick(${threadId}, '${spanId}')`;

            return parentRender;
        }
        throw new Error('Rendering Comments failed.');
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

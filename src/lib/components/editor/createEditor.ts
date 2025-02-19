import { Editor } from 'aquifer-tiptap';
import type { EditorOptions } from '@tiptap/core';
import { readable, type Readable } from 'svelte/store';

export const createEditor = (options: Partial<EditorOptions>): Readable<Editor> => {
    const editor = new Editor(options);

    return readable(editor, (set) => {
        let updatePending = false;
        let animationFrameId: number | undefined;

        const update = () => {
            updatePending = false;
            animationFrameId = undefined;
            set(editor);
        };

        editor.on('transaction', () => {
            if (!updatePending) {
                updatePending = true;
                animationFrameId = requestAnimationFrame(update);
            }
        });

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                updatePending = false;
            }
            editor.off('transaction');
            editor.destroy();
        };
    });
};

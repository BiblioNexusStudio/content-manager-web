// taken from https://github.com/sereneinserenade/tiptap-extension-video
import { Node } from '@tiptap/core';

export const Video = Node.create({
    name: 'video',

    group: 'block',

    addAttributes() {
        return {
            src: {
                default: null,
                parseHTML: (el: HTMLSpanElement) => (el as HTMLSpanElement).getAttribute('src'),
                renderHTML: (attrs) => ({ src: attrs.src }),
            },
            poster: {
                default: null,
                parseHTML: (el: HTMLSpanElement) => el.getAttribute('poster'),
                renderHTML: (attrs) => ({ poster: attrs.poster }),
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'video',
                getAttrs: (el) => ({
                    src: (el as HTMLVideoElement).getAttribute('src'),
                    poster: (el as HTMLVideoElement).getAttribute('poster') ?? '',
                }),
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['video', { controls: 'true', style: 'width: 100%', ...HTMLAttributes }, ['source', HTMLAttributes]];
    },
});
